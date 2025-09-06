import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateVietQRConfig, VIETNAM_BANKS } from '@/lib/vietqr';
import { validateKofiUsername } from '@/lib/kofi';
import { z } from 'zod';

// Schema for donation settings
const donationSettingsSchema = z.object({
  // Ko-fi settings
  kofiUsername: z.string().optional(),
  kofiWebhookToken: z.string().optional(),
  kofiButtonColor: z.string().default('FF5F5F'),
  kofiDefaultMessage: z.string().optional(),
  kofiEnabled: z.boolean().default(false),
  
  // VietQR settings
  vietqrBankId: z.string().optional(),
  vietqrAccountNo: z.string().optional(),
  vietqrAccountName: z.string().optional(),
  vietqrTemplate: z.string().default('compact2'),
  vietqrEnabled: z.boolean().default(false),
  
  // General settings
  donationsEnabled: z.boolean().default(true),
  manualDonationsEnabled: z.boolean().default(true),
  usdToVndRate: z.number().default(27000),
  
  // Display settings
  showDonationGoal: z.boolean().default(true),
  showRecentDonations: z.boolean().default(true),
  maxRecentDonations: z.number().default(10)
});

/**
 * Get donation settings (Admin only)
 * GET /api/admin/donation-settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all donation-related settings
    const settings = await prisma.setting.findMany({
      where: {
        category: 'donations'
      }
    });

    // Transform settings array to object (keep raw strings to avoid unwanted coercion)
    const settingsObject: Record<string, any> = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    // Add available banks for reference
    const response = {
      settings: settingsObject,
      availableBanks: VIETNAM_BANKS,
      qrTemplates: [
        { value: 'compact', label: 'Compact' },
        { value: 'compact2', label: 'Compact 2' },
        { value: 'qr_only', label: 'QR Only' },
        { value: 'print', label: 'Print' }
      ]
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get donation settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update donation settings (Admin only)
 * PUT /api/admin/donation-settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = donationSettingsSchema.parse(body);

    // Validate Ko-fi settings if provided
    if (validatedData.kofiEnabled) {
      if (!validatedData.kofiUsername) {
        return NextResponse.json(
          { error: 'Ko-fi username is required when Ko-fi is enabled' },
          { status: 400 }
        );
      }

      if (!validateKofiUsername(validatedData.kofiUsername)) {
        return NextResponse.json(
          { error: 'Invalid Ko-fi username format' },
          { status: 400 }
        );
      }

      if (!validatedData.kofiWebhookToken) {
        return NextResponse.json(
          { error: 'Ko-fi webhook token is required when Ko-fi is enabled' },
          { status: 400 }
        );
      }
    }

    // Validate VietQR settings if provided
    if (validatedData.vietqrEnabled) {
      if (!validatedData.vietqrBankId || !validatedData.vietqrAccountNo || !validatedData.vietqrAccountName) {
        return NextResponse.json(
          { error: 'Bank ID, account number, and account name are required when VietQR is enabled' },
          { status: 400 }
        );
      }

      const vietqrConfig = {
        bankId: validatedData.vietqrBankId,
        accountNo: validatedData.vietqrAccountNo,
        accountName: validatedData.vietqrAccountName,
        template: validatedData.vietqrTemplate
      };

      const validation = validateVietQRConfig(vietqrConfig);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Invalid VietQR configuration', details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Update settings in database
    const settingsToUpdate = Object.entries(validatedData).map(([key, value]) => ({
      key,
      value: String(value),
      category: 'donations',
      isPublic: [
        'donationsEnabled',
        'showDonationGoal', 
        'showRecentDonations',
        'kofiEnabled',
        'vietqrEnabled',
        'kofiUsername',
        'kofiButtonColor'
      ].includes(key)
    }));

    // Use upsert to create or update each setting
    await Promise.all(
      settingsToUpdate.map(setting =>
        prisma.setting.upsert({
          where: {
            key: setting.key
          },
          update: {
            value: setting.value,
            isPublic: setting.isPublic,
            updatedAt: new Date()
          },
          create: {
            key: setting.key,
            value: setting.value,
            category: setting.category,
            isPublic: setting.isPublic
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Donation settings updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update donation settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Test donation configuration (Admin only)
 * POST /api/admin/donation-settings/test
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, config } = body;

    if (type === 'vietqr') {
      const validation = validateVietQRConfig(config);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'VietQR configuration is invalid', details: validation.errors },
          { status: 400 }
        );
      }

      // Generate a test QR code
      const { generateDonationQR } = await import('@/lib/vietqr');
      const testQR = generateDonationQR(
        config,
        5, // $5 test amount
        'TEST_' + Date.now(),
        'Test Donor',
        'Test donation message'
      );

      return NextResponse.json({
        success: true,
        message: 'VietQR configuration is valid',
        testData: testQR
      });
    }

    if (type === 'kofi') {
      if (!validateKofiUsername(config.username)) {
        return NextResponse.json(
          { error: 'Invalid Ko-fi username format' },
          { status: 400 }
        );
      }

      const { generateKofiLink } = await import('@/lib/kofi');
      const testLink = generateKofiLink(config.username, {
        amount: 5,
        message: 'Test donation'
      });

      return NextResponse.json({
        success: true,
        message: 'Ko-fi configuration is valid',
        testData: {
          profileUrl: `https://ko-fi.com/${config.username}`,
          donationUrl: testLink
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid test type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Test donation settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
