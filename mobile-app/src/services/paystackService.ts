import api from './api';
import { ENDPOINTS } from '../constants/api';

// Paystack configuration
// Keys should be set via environment variables in app.config.js or .env
export const PAYSTACK_CONFIG = {
  PUBLIC_KEY: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with actual key from backend
  SECRET_KEY: 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Never expose in client - use backend
  CURRENCY: 'GHS',
  CHANNELS: ['card', 'mobile_money', 'bank', 'ussd', 'qr'] as const,
};

// Types
export interface PaystackInitializeRequest {
  email: string;
  amount: number; // Amount in pesewas (kobo equivalent)
  currency?: string;
  reference?: string;
  callback_url?: string;
  channels?: typeof PAYSTACK_CONFIG.CHANNELS[number][];
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
    [key: string]: any;
  };
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    fees: number;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
    };
  };
}

export interface PaystackChargeRequest {
  email: string;
  amount: number;
  authorization_code?: string; // For recurring charges
  reference?: string;
  currency?: string;
  metadata?: any;
  // Mobile Money specific
  mobile_money?: {
    phone: string;
    provider: 'mtn' | 'vod' | 'tgo'; // MTN, Vodafone, AirtelTigo
  };
  // USSD specific
  ussd?: {
    type: string;
  };
}

export interface PaystackMobileMoneyChargeRequest {
  email: string;
  amount: number;
  currency: string;
  mobile_money: {
    phone: string;
    provider: 'mtn' | 'vod' | 'tgo';
  };
  reference?: string;
  metadata?: any;
}

export interface PaystackBankListResponse {
  status: boolean;
  message: string;
  data: Array<{
    id: number;
    name: string;
    slug: string;
    code: string;
    longcode: string;
    gateway: string;
    pay_with_bank: boolean;
    active: boolean;
    country: string;
    currency: string;
    type: string;
    is_deleted: boolean;
  }>;
}

// Generate unique reference
export const generateReference = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `SIKA_${timestamp}_${random}`;
};

// Paystack Service
const paystackService = {
  /**
   * Initialize a card payment transaction
   * Returns authorization URL for Paystack checkout
   */
  initializeCardPayment: async (request: PaystackInitializeRequest): Promise<PaystackInitializeResponse> => {
    const payload = {
      ...request,
      amount: Math.round(request.amount * 100), // Convert to pesewas
      currency: request.currency || PAYSTACK_CONFIG.CURRENCY,
      reference: request.reference || generateReference(),
      channels: request.channels || ['card'],
    };

    const response = await api.post(ENDPOINTS.WALLET.DEPOSIT_CARD, payload);
    return response.data;
  },

  /**
   * Initialize Mobile Money payment (USSD Push)
   * Sends a prompt to the user's phone
   */
  initializeMobileMoneyPayment: async (
    email: string,
    amount: number,
    phone: string,
    provider: 'mtn' | 'vod' | 'tgo',
    metadata?: any
  ): Promise<PaystackInitializeResponse> => {
    const payload: PaystackMobileMoneyChargeRequest = {
      email,
      amount: Math.round(amount * 100), // Convert to pesewas
      currency: PAYSTACK_CONFIG.CURRENCY,
      mobile_money: {
        phone: phone.replace(/\s/g, ''), // Remove spaces
        provider,
      },
      reference: generateReference(),
      metadata: {
        ...metadata,
        payment_type: 'mobile_money_deposit',
      },
    };

    const response = await api.post(ENDPOINTS.WALLET.DEPOSIT_MOBILE_MONEY, payload);
    return response.data;
  },

  /**
   * Verify a transaction by reference
   */
  verifyTransaction: async (reference: string): Promise<PaystackVerifyResponse> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.TRANSACTIONS}/${reference}/verify/`);
    return response.data;
  },

  /**
   * Charge a saved card using authorization code
   */
  chargeAuthorization: async (
    email: string,
    amount: number,
    authorizationCode: string,
    metadata?: any
  ): Promise<PaystackVerifyResponse> => {
    const payload = {
      email,
      amount: Math.round(amount * 100),
      authorization_code: authorizationCode,
      currency: PAYSTACK_CONFIG.CURRENCY,
      reference: generateReference(),
      metadata,
    };

    const response = await api.post(`${ENDPOINTS.PAYMENTS.PROCESS}`, payload);
    return response.data;
  },

  /**
   * Get list of supported banks for bank transfer
   */
  getBankList: async (country: string = 'ghana'): Promise<PaystackBankListResponse> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.AVAILABLE_METHODS}?country=${country}`);
    return response.data;
  },

  /**
   * Initialize bank transfer deposit
   * Returns virtual account details for transfer
   */
  initializeBankTransfer: async (
    email: string,
    amount: number,
    metadata?: any
  ): Promise<any> => {
    const payload = {
      email,
      amount: Math.round(amount * 100),
      currency: PAYSTACK_CONFIG.CURRENCY,
      reference: generateReference(),
      metadata: {
        ...metadata,
        payment_type: 'bank_transfer_deposit',
      },
    };

    const response = await api.post(ENDPOINTS.WALLET.DEPOSIT_BANK_TRANSFER, payload);
    return response.data;
  },

  /**
   * Check payment status by reference
   */
  checkPaymentStatus: async (reference: string): Promise<{
    status: 'pending' | 'success' | 'failed';
    message: string;
    data?: any;
  }> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.TRANSACTIONS}/${reference}/status/`);
    return response.data;
  },

  /**
   * Get saved payment methods (cards) for user
   */
  getSavedCards: async (): Promise<Array<{
    id: string;
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bank: string;
    brand: string;
    reusable: boolean;
  }>> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.METHODS}?type=card`);
    return response.data.data || [];
  },

  /**
   * Delete a saved payment method
   */
  deleteSavedCard: async (authorizationCode: string): Promise<void> => {
    await api.delete(`${ENDPOINTS.PAYMENTS.METHODS}/${authorizationCode}/`);
  },
};

export default paystackService;
