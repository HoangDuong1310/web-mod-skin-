/**
 * Payment Configuration
 * Centralized config for all payment methods
 */

// Bank config for VietQR
export const BANK_CONFIG = {
  bankId: process.env.NEXT_PUBLIC_BANK_ID || '970422', // MBBank default
  accountNo: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || '',
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || '',
  template: 'compact2',
}

// Ko-fi config
export const KOFI_CONFIG = {
  username: process.env.NEXT_PUBLIC_KOFI_USERNAME || '',
  pageUrl: process.env.NEXT_PUBLIC_KOFI_USERNAME 
    ? `https://ko-fi.com/${process.env.NEXT_PUBLIC_KOFI_USERNAME}` 
    : '',
  webhookToken: process.env.KOFI_WEBHOOK_TOKEN || '',
}

// PayPal config
export const PAYPAL_CONFIG = {
  email: process.env.NEXT_PUBLIC_PAYPAL_EMAIL || '',
  paypalMe: process.env.NEXT_PUBLIC_PAYPAL_ME || 'https://paypal.me/hoangduong1310',
}

// Contact info
export const CONTACT_INFO = {
  discord: 'https://discord.gg/gphF74brpQ',
  telegram: 'https://web.telegram.org/k/#@ainzskin',
  facebook: '',
  email: '',
}

// Check if payment config is valid
export function isPaymentConfigValid() {
  return {
    bank: !!(BANK_CONFIG.accountNo && BANK_CONFIG.accountName),
    kofi: !!KOFI_CONFIG.username,
    paypal: !!PAYPAL_CONFIG.email,
    hasAnyContact: !!(CONTACT_INFO.discord || CONTACT_INFO.telegram || CONTACT_INFO.facebook || CONTACT_INFO.email),
  }
}
