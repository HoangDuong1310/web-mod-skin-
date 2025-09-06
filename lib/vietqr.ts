/**
 * VietQR Integration for Vietnamese Bank Transfers
 * Generates QR codes for quick bank transfers using VietQR API
 */

export interface VietQRConfig {
  bankId: string;        // Bank identifier (e.g., 'vietinbank', 'techcombank')
  accountNo: string;     // Bank account number
  accountName: string;   // Account holder name
  template?: string;     // QR template (compact, compact2, qr_only, etc.)
}

export interface VietQROptions {
  amount?: number;       // Amount in VND (optional)
  addInfo: string;       // Transfer description/note
  accountName?: string;  // Override account name
}

// Exchange rate: 1 USD = 27,000 VND (configurable)
export const USD_TO_VND_RATE = 27000;

// Popular Vietnamese banks with their VietQR bank IDs
export const VIETNAM_BANKS = {
  vietinbank: { id: '970415', name: 'VietinBank' },
  techcombank: { id: '970407', name: 'Techcombank' },
  vietcombank: { id: '970436', name: 'Vietcombank' },
  acb: { id: '970416', name: 'ACB' },
  sacombank: { id: '970403', name: 'Sacombank' },
  vpbank: { id: '970432', name: 'VPBank' },
  bidv: { id: '970418', name: 'BIDV' },
  mbbank: { id: '970422', name: 'MBBank' },
  tpbank: { id: '970423', name: 'TPBank' },
  agribank: { id: '970405', name: 'Agribank' }
} as const;

/**
 * Convert USD to VND with current exchange rate
 */
export function convertUSDToVND(usdAmount: number, rate: number = USD_TO_VND_RATE): number {
  return Math.round(usdAmount * rate);
}

/**
 * Format currency amount for display
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Format currency amount for USD display
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Generate VietQR URL for bank transfer
 * 
 * @param config Bank configuration
 * @param options Transfer options
 * @returns VietQR URL for generating QR code
 */
export function generateVietQRUrl(config: VietQRConfig, options: VietQROptions): string {
  const {
    bankId,
    accountNo,
    template = 'compact2'
  } = config;

  const {
    amount,
    addInfo,
    accountName
  } = options;

  // Build VietQR URL according to API format
  // https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
  const params = new URLSearchParams()
  if (typeof amount === 'number' && amount > 0) params.append('amount', String(amount))
  params.append('addInfo', addInfo)
  params.append('accountName', accountName || config.accountName)
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?${params.toString()}`;

  return qrUrl;
}

/**
 * Generate donation-specific VietQR with automatic USD to VND conversion
 */
export function generateDonationQR(
  config: VietQRConfig,
  usdAmount: number,
  donationId: string,
  donorName?: string,
  message?: string
): {
  qrUrl: string;
  vndAmount: number;
  transferNote: string;
  displayInfo: {
    usdAmount: string;
    vndAmount: string;
    bankName: string;
    accountNo: string;
    accountName: string;
  };
} {
  // Convert USD to VND
  const vndAmount = convertUSDToVND(usdAmount);
  
  // Create transfer note with donation ID for tracking
  const transferNote = message 
    ? `Donation ${donationId}: ${message}`.substring(0, 100) // Limit to 100 chars
    : `Donation ${donationId}${donorName ? ` from ${donorName}` : ''}`;

  // Generate QR URL
  const qrUrl = generateVietQRUrl(config, {
    amount: vndAmount,
    addInfo: transferNote,
    accountName: config.accountName
  });

  // Get bank info
  const bankEntry = Object.entries(VIETNAM_BANKS).find(([_, bank]) => bank.id === config.bankId);
  const bankName = bankEntry ? bankEntry[1].name : 'Unknown Bank';

  return {
    qrUrl,
    vndAmount,
    transferNote,
    displayInfo: {
      usdAmount: formatUSD(usdAmount),
      vndAmount: formatVND(vndAmount),
      bankName,
      accountNo: config.accountNo,
      accountName: config.accountName
    }
  };
}

/**
 * Validate VietQR configuration
 */
export function validateVietQRConfig(config: VietQRConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.bankId) {
    errors.push('Bank ID is required');
  }

  if (!config.accountNo) {
    errors.push('Account number is required');
  } else if (!/^\d{6,19}$/.test(config.accountNo)) {
    errors.push('Account number must be 6-19 digits');
  }

  if (!config.accountName || config.accountName.trim().length < 2) {
    errors.push('Account name must be at least 2 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get available QR templates
 */
export function getQRTemplates() {
  return [
    { value: 'compact', label: 'Compact' },
    { value: 'compact2', label: 'Compact 2' },
    { value: 'qr_only', label: 'QR Only' },
    { value: 'print', label: 'Print' }
  ];
}

/**
 * Example usage and test data
 */
export const EXAMPLE_CONFIG: VietQRConfig = {
  bankId: '970415', // VietinBank
  accountNo: '113366668888',
  accountName: 'WebModSkin Donation',
  template: 'compact2'
};

export const TEST_DONATION = {
  usdAmount: 5,
  donationId: 'test-123',
  donorName: 'Anonymous Supporter',
  message: 'Keep up the great work!'
};
