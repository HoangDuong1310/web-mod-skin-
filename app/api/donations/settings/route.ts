import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint exposing only the fields needed by the client donation form.
// Does not require auth. Avoids using the admin-only endpoint so non-admin visitors
// can still see which methods are available and generate VietQR.
export async function GET() {
  try {
  const settings = await prisma.setting.findMany({
      where: { category: 'donations' },
    })

    const settingsObject: Record<string, any> = {}
    for (const s of settings) {
      settingsObject[s.key] = s.value
    }

    const publicSettings = {
      // Explicitly expose only these safe keys
  kofiEnabled: settingsObject.kofiEnabled === 'true' || settingsObject.kofiEnabled === true,
  kofiUsername: (settingsObject.kofiUsername as string) || undefined,
  vietqrEnabled: settingsObject.vietqrEnabled === 'true' || settingsObject.vietqrEnabled === true,
  vietqrBankId: (settingsObject.vietqrBankId as string) || undefined,
  vietqrAccountNo: (settingsObject.vietqrAccountNo as string) || undefined,
  vietqrAccountName: (settingsObject.vietqrAccountName as string) || undefined,
  usdToVndRate: Number(settingsObject.usdToVndRate ?? 27000) || 27000,
    }

    return NextResponse.json({ settings: publicSettings })
  } catch (error) {
    console.error('Public donation settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
