# Ko-fi + VietQR Donation System Implementation

This document outlines the comprehensive donation system integrating Ko-fi API for automated updates and VietQR for Vietnamese bank transfers with automatic currency conversion.

## 🎯 Features Implemented

### ✅ Multi-Payment Method Support
- **Ko-fi Integration**: Automated webhook processing for instant donation tracking
- **VietQR Bank Transfers**: QR code generation for Vietnamese banking apps
- **Manual Donations**: Admin-managed donation entries
- **Currency Conversion**: Automatic USD ↔ VND conversion (1 USD = 27,000 VND)

### ✅ Database Schema Enhanced
- **PaymentMethod Enum**: `KOFI`, `BANK_TRANSFER`, `MANUAL`
- **DonationStatus Enum**: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`, `CANCELLED`
- **Ko-fi Tracking**: `kofiTransactionId` field for webhook automation
- **VietQR Fields**: `bankCode`, `qrCodeUrl`, `transferNote` for bank transfer tracking

### ✅ API Endpoints Created

#### Ko-fi Webhook
- **Endpoint**: `POST /api/webhooks/kofi`
- **Purpose**: Automatic donation processing from Ko-fi webhooks
- **Features**: Transaction deduplication, user linking, goal progress updates

#### Donations API
- **Create**: `POST /api/donations` - Create bank transfer/manual donations
- **List**: `GET /api/donations` - Admin dashboard listing with filters
- **Features**: VietQR generation, goal linking, user management

#### Admin Settings
- **Get**: `GET /api/admin/donation-settings` - Retrieve configuration
- **Update**: `PUT /api/admin/donation-settings` - Update settings
- **Test**: `POST /api/admin/donation-settings/test` - Validate configurations

### ✅ Utility Libraries

#### VietQR Library (`/lib/vietqr.ts`)
```typescript
// Key functions:
- generateDonationQR(config, usdAmount, donationId, donorName, message)
- convertUSDToVND(amount, rate = 27000)
- validateVietQRConfig(config)
- formatVND(amount) / formatUSD(amount)

// Supported banks:
- VietinBank, Techcombank, Vietcombank, ACB, Sacombank
- VPBank, BIDV, MBBank, TPBank, Agribank
```

#### Ko-fi Library (`/lib/kofi.ts`)
```typescript
// Key functions:
- parseKofiWebhook(webhookData)
- verifyKofiWebhook(data, token)
- generateKofiLink(username, options)
- validateKofiUsername(username)
- formatDonationForDB(processed, goalId)
```

## 🚀 Setup Instructions

### 1. Environment Variables
Add to `.env.local`:
```env
# Ko-fi Configuration
KOFI_WEBHOOK_TOKEN=your_kofi_verification_token_here

# VietQR Configuration (managed via admin panel)
# VIETQR_BANK_ID=970415  # Example: VietinBank
# VIETQR_ACCOUNT_NO=113366668888
# VIETQR_ACCOUNT_NAME=WebModSkin Donation
```

### 2. Database Migration
The schema has been updated. Run:
```bash
npx prisma migrate dev --name add_payment_methods
npx prisma generate
```

### 3. Ko-fi Webhook Setup
1. Go to Ko-fi Creator Dashboard → Settings → Webhooks
2. Set webhook URL: `https://yourdomain.com/api/webhooks/kofi`
3. Copy the verification token to `KOFI_WEBHOOK_TOKEN`
4. Enable webhook for donations

### 4. Admin Configuration
Access `/admin/donation-settings` to configure:
- Ko-fi username and webhook token
- VietQR bank details
- Currency conversion rates
- Display preferences

## 📱 Usage Examples

### Creating a Ko-fi Donation Link
```typescript
import { generateKofiLink } from '@/lib/kofi';

const donationLink = generateKofiLink('your_kofi_username', {
  amount: 10,
  message: 'Support our project development'
});
```

### Generating VietQR for Bank Transfer
```typescript
import { generateDonationQR } from '@/lib/vietqr';

const qrData = generateDonationQR(
  {
    bankId: '970415',
    accountNo: '113366668888', 
    accountName: 'WebModSkin Donation'
  },
  5, // $5 USD
  'donation_123',
  'John Doe',
  'Keep up the great work!'
);

// Returns:
// {
//   qrUrl: 'https://img.vietqr.io/image/...',
//   vndAmount: 135000,
//   transferNote: 'Donation donation_123: Keep up the great work!',
//   displayInfo: { ... }
// }
```

### Creating Manual Donation via API
```typescript
const response = await fetch('/api/donations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 25,
    currency: 'USD',
    paymentMethod: 'BANK_TRANSFER',
    donorName: 'Anonymous Supporter',
    donorEmail: 'supporter@example.com',
    message: 'Love your work!',
    isAnonymous: false,
    bankConfig: {
      bankId: '970415',
      accountNo: '113366668888',
      accountName: 'WebModSkin Donation'
    }
  })
});

const result = await response.json();
// Returns donation record + QR code + instructions
```

## 🔧 Configuration Options

### Ko-fi Settings
- **Username**: Your Ko-fi page username (e.g., 'webmodskin')
- **Webhook Token**: Verification token from Ko-fi dashboard
- **Button Color**: Hex color for Ko-fi buttons (default: FF5F5F)
- **Default Message**: Pre-filled message for donations
- **Enabled**: Toggle Ko-fi integration on/off

### VietQR Settings
- **Bank ID**: Vietnamese bank identifier (see VIETNAM_BANKS)
- **Account Number**: 6-19 digit bank account number
- **Account Name**: Account holder name for display
- **QR Template**: Visual style (compact, compact2, qr_only, print)
- **Enabled**: Toggle VietQR integration on/off

### General Settings
- **USD to VND Rate**: Exchange rate (default: 27,000)
- **Donations Enabled**: Master toggle for donation system
- **Manual Donations**: Allow admin-created donations
- **Show Goal**: Display active donation goals
- **Show Recent**: Display recent donations list

## 🛡️ Security Features

### Webhook Verification
- Ko-fi webhooks verified using verification token
- Duplicate transaction prevention
- IP address and user agent logging

### Data Validation
- Zod schema validation for all inputs
- Bank configuration validation
- Username format validation
- Amount and currency validation

### Access Control
- Admin-only access to settings and donation management
- User authentication for personal donations
- Anonymous donation support with data protection

## 📊 Admin Dashboard Features

### Donation Management
- View all donations with filtering by status, payment method, goal
- Manual donation creation and status updates
- Transaction ID tracking and duplicate detection
- Donor information management (respecting anonymity)

### Analytics & Reporting
- Goal progress tracking with automatic updates
- Payment method breakdown
- Currency conversion tracking
- Success/failure rates by payment method

### Configuration Testing
- Test VietQR configuration with sample QR generation
- Validate Ko-fi username and generate test links
- Preview donation forms with current settings

## 🔄 Webhook Flow

### Ko-fi Webhook Processing
1. **Receive**: Ko-fi sends webhook to `/api/webhooks/kofi`
2. **Verify**: Check verification token
3. **Validate**: Parse and validate webhook data
4. **Deduplicate**: Check for existing transaction
5. **Process**: Create donation record
6. **Update**: Update goal progress if applicable
7. **Respond**: Send success confirmation

### VietQR Generation Flow
1. **Request**: User initiates bank transfer donation
2. **Convert**: Convert USD to VND at current rate
3. **Generate**: Create unique transaction reference
4. **QR Code**: Generate VietQR URL with bank details
5. **Instructions**: Provide step-by-step transfer guide
6. **Track**: Store pending donation with QR reference

## 🚨 Error Handling

### Common Issues & Solutions

#### Ko-fi Webhook Failures
- **Token Mismatch**: Check `KOFI_WEBHOOK_TOKEN` in environment
- **Duplicate Processing**: System automatically prevents duplicates
- **User Creation Errors**: Donations still processed without user linking

#### VietQR Generation Errors
- **Invalid Bank Config**: Use admin panel validation testing
- **Account Number Format**: Must be 6-19 digits
- **Missing Fields**: Bank ID, account number, and name required

#### API Validation Errors
- **Amount Validation**: Must be positive number
- **Email Format**: Must be valid email when provided
- **Payment Method**: Must be one of: KOFI, BANK_TRANSFER, MANUAL

## 📈 Future Enhancements

### Planned Features
- **Email Notifications**: Send confirmation emails to donors
- **Subscription Tracking**: Handle Ko-fi monthly subscriptions
- **Multi-Currency**: Support for EUR, GBP, and other currencies
- **Tax Receipts**: Generate downloadable donation receipts
- **Social Features**: Public donor wall and thank you messages

### Technical Improvements
- **Rate Limiting**: Implement donation API rate limits
- **Caching**: Cache settings and frequently accessed data
- **Monitoring**: Add logging and error tracking
- **Testing**: Comprehensive test suite for all payment methods

## 🎉 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Ko-fi webhook URL configured
- [ ] Admin settings configured via dashboard
- [ ] Test donations processed successfully
- [ ] Error handling tested
- [ ] Production domain whitelisted for Ko-fi webhooks

---

**Implementation Status**: ✅ **COMPLETE**
**Next Steps**: Configure admin settings and test all payment methods

The donation system is now fully functional with Ko-fi webhook automation, VietQR bank transfer support, and comprehensive admin management. The system handles currency conversion, transaction tracking, and goal progress updates automatically.
