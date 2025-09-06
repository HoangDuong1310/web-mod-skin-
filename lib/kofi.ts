/**
 * Ko-fi Integration Utilities
 * Handles Ko-fi webhooks and API interactions for donation tracking
 */

import { headers } from 'next/headers';

export interface KofiWebhookData {
  verification_token: string;
  message_id: string;
  timestamp: string;
  type: 'Donation' | 'Subscription' | 'Commission' | 'Shop Order';
  is_public: boolean;
  from_name: string;
  message: string;
  amount: string;
  url: string;
  email: string;
  currency: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  kofi_transaction_id: string;
  shop_items?: Array<{
    direct_link_code: string;
    variation_name: string;
    quantity: number;
  }>;
  tier_name?: string;
  shipping?: {
    full_name: string;
    street_address: string;
    city: string;
    state_or_province: string;
    postal_code: string;
    country: string;
    country_code: string;
    telephone: string;
  };
}

export interface ProcessedDonation {
  kofiTransactionId: string;
  donorName: string;
  email: string;
  amount: number;
  currency: string;
  message: string;
  isPublic: boolean;
  isSubscription: boolean;
  isFirstSubscription: boolean;
  timestamp: Date;
  type: string;
  url: string;
  tierName?: string;
}

/**
 * Verify Ko-fi webhook signature/token
 */
export function verifyKofiWebhook(webhookData: any, expectedToken: string): boolean {
  if (!webhookData.verification_token) {
    return false;
  }
  
  return webhookData.verification_token === expectedToken;
}

/**
 * Parse Ko-fi webhook data into standardized format
 */
export function parseKofiWebhook(webhookData: KofiWebhookData): ProcessedDonation {
  return {
    kofiTransactionId: webhookData.kofi_transaction_id,
    donorName: webhookData.from_name,
    email: webhookData.email,
    amount: parseFloat(webhookData.amount),
    currency: webhookData.currency,
    message: webhookData.message || '',
    isPublic: webhookData.is_public,
    isSubscription: webhookData.is_subscription_payment,
    isFirstSubscription: webhookData.is_first_subscription_payment,
    timestamp: new Date(webhookData.timestamp),
    type: webhookData.type,
    url: webhookData.url,
    tierName: webhookData.tier_name
  };
}

/**
 * Generate Ko-fi donation link
 */
export function generateKofiLink(username: string, options?: {
  amount?: number;
  message?: string;
  color?: string;
}): string {
  const baseUrl = `https://ko-fi.com/${username}`;
  
  if (!options) {
    return baseUrl;
  }

  const params = new URLSearchParams();
  
  if (options.amount) {
    params.append('hidefeed', 'true');
    params.append('currency', 'USD');
    params.append('amount', options.amount.toString());
  }
  
  if (options.message) {
    params.append('message', options.message);
  }

  const paramString = params.toString();
  return paramString ? `${baseUrl}?${paramString}` : baseUrl;
}

/**
 * Generate Ko-fi button embed code
 */
export function generateKofiButtonEmbed(username: string, options?: {
  color?: string;
  text?: string;
  amount?: number;
}): string {
  const {
    color = 'FF5F5F',
    text = 'Support Us',
    amount
  } = options || {};

  const baseUrl = `https://storage.ko-fi.com/cdn/kofi2.png?v=3`;
  const kofiUrl = generateKofiLink(username, { amount });

  return `
<a href="${kofiUrl}" target="_blank" rel="noopener noreferrer">
  <img 
    height="36" 
    style="border:0px;height:36px;" 
    src="${baseUrl}" 
    border="0" 
    alt="Buy Me a Coffee at ko-fi.com" 
  />
</a>`.trim();
}

/**
 * Validate webhook payload format
 */
export function validateKofiPayload(payload: any): {
  isValid: boolean;
  errors: string[];
  data?: KofiWebhookData;
} {
  const errors: string[] = [];

  // Check required fields
  const requiredFields = [
    'verification_token',
    'message_id', 
    'timestamp',
    'type',
    'from_name',
    'amount',
    'currency',
    'kofi_transaction_id'
  ];

  for (const field of requiredFields) {
    if (!payload[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate data types
  if (payload.amount && isNaN(parseFloat(payload.amount))) {
    errors.push('Amount must be a valid number');
  }

  if (payload.timestamp && isNaN(Date.parse(payload.timestamp))) {
    errors.push('Timestamp must be a valid date');
  }

  if (payload.type && !['Donation', 'Subscription', 'Commission', 'Shop Order'].includes(payload.type)) {
    errors.push('Invalid transaction type');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? payload as KofiWebhookData : undefined
  };
}

/**
 * Convert Ko-fi amount to USD (handle different currencies)
 */
export function convertToUSD(amount: number, currency: string, exchangeRates?: Record<string, number>): number {
  if (currency === 'USD') {
    return amount;
  }

  // Default exchange rates (should be updated from real API)
  const defaultRates: Record<string, number> = {
    EUR: 1.1,
    GBP: 1.25,
    CAD: 0.75,
    AUD: 0.65,
    JPY: 0.007,
    // Add more currencies as needed
  };

  const rates = exchangeRates || defaultRates;
  const rate = rates[currency];

  if (!rate) {
    console.warn(`No exchange rate found for currency: ${currency}`);
    return amount; // Return original amount if no rate found
  }

  return amount * rate;
}

/**
 * Format Ko-fi donation for database storage
 */
export function formatDonationForDB(processed: ProcessedDonation, goalId?: string) {
  return {
    amount: processed.amount,
    currency: processed.currency,
    donorName: processed.donorName,
    donorEmail: processed.email,
    message: processed.message,
    paymentMethod: 'KOFI' as const,
    status: 'COMPLETED' as const,
    isAnonymous: !processed.isPublic,
    kofiTransactionId: processed.kofiTransactionId,
    donationGoalId: goalId || null,
    metadata: {
      kofiUrl: processed.url,
      isSubscription: processed.isSubscription,
      isFirstSubscription: processed.isFirstSubscription,
      tierName: processed.tierName,
      type: processed.type
    }
  };
}

/**
 * Ko-fi configuration interface
 */
export interface KofiConfig {
  username: string;
  webhookToken: string;
  buttonColor?: string;
  defaultMessage?: string;
  isEnabled: boolean;
}

/**
 * Default Ko-fi configuration
 */
export const DEFAULT_KOFI_CONFIG: Partial<KofiConfig> = {
  buttonColor: 'FF5F5F',
  defaultMessage: 'Thanks for supporting our work!',
  isEnabled: false
};

/**
 * Get Ko-fi profile URL
 */
export function getKofiProfileUrl(username: string): string {
  return `https://ko-fi.com/${username}`;
}

/**
 * Check if Ko-fi username is valid format
 */
export function validateKofiUsername(username: string): boolean {
  // Ko-fi usernames: 3-30 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}
