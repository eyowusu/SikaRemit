import api from './api';
import { ENDPOINTS } from '../constants/api';

// Flutterwave configuration
export const FLUTTERWAVE_CONFIG = {
  PUBLIC_KEY: 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X',
  SECRET_KEY: 'FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X',
  ENCRYPTION_KEY: 'FLWSECK_TESTxxxxxxxxxxxxxxxx',
  CURRENCY: 'GHS',
  COUNTRY: 'GH',
  PAYMENT_OPTIONS: 'card,mobilemoney,ussd,banktransfer' as const,
};

// Types
export interface FlutterwavePaymentRequest {
  tx_ref: string;
  amount: number;
  currency?: string;
  redirect_url?: string;
  payment_options?: string;
  customer: {
    email: string;
    phone_number?: string;
    name?: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

export interface FlutterwavePaymentResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    link: string;
    tx_ref: string;
    flw_ref?: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: 'successful' | 'failed' | 'pending';
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    card?: {
      first_6digits: string;
      last_4digits: string;
      issuer: string;
      country: string;
      type: string;
      expiry: string;
    };
  };
}

export interface FlutterwaveMobileMoneyRequest {
  tx_ref: string;
  amount: number;
  currency?: string;
  email: string;
  phone_number: string;
  network: 'MTN' | 'VODAFONE' | 'TIGO';
  voucher?: string; // For Vodafone Cash
  redirect_url?: string;
  meta?: Record<string, any>;
}

export interface FlutterwaveMobileMoneyResponse {
  status: 'success' | 'error';
  message: string;
  meta?: {
    authorization: {
      mode: 'callback' | 'redirect' | 'otp';
      redirect?: string;
      validate_instructions?: string;
    };
  };
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    currency: string;
    ip: string;
    narration: string;
    status: string;
    auth_url: string | null;
    payment_type: string;
    fraud_status: string;
    created_at: string;
    account_id: number;
  };
}

export interface FlutterwaveBankTransferRequest {
  tx_ref: string;
  amount: number;
  email: string;
  phone_number?: string;
  currency?: string;
  narration?: string;
  is_permanent?: boolean;
  meta?: Record<string, any>;
}

export interface FlutterwaveBankTransferResponse {
  status: 'success' | 'error';
  message: string;
  meta?: {
    authorization: {
      transfer_reference: string;
      transfer_account: string;
      transfer_bank: string;
      account_expiration: string;
      transfer_note: string;
      transfer_amount: number;
      mode: string;
    };
  };
}

export interface FlutterwaveChargeCardRequest {
  card_number: string;
  cvv: string;
  expiry_month: string;
  expiry_year: string;
  currency?: string;
  amount: number;
  email: string;
  fullname?: string;
  phone_number?: string;
  tx_ref: string;
  redirect_url?: string;
  authorization?: {
    mode: 'pin' | 'avs_noauth' | '3ds';
    pin?: string;
    city?: string;
    address?: string;
    state?: string;
    country?: string;
    zipcode?: string;
  };
  meta?: Record<string, any>;
}

export interface FlutterwaveSavedCard {
  token: string;
  email: string;
  first_6digits: string;
  last_4digits: string;
  issuer: string;
  country: string;
  type: string;
  expiry: string;
}

// Generate unique reference for Flutterwave
export const generateFlwReference = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `SIKA_FLW_${timestamp}_${random}`;
};

// Flutterwave Service
const flutterwaveService = {
  /**
   * Initialize standard payment (redirects to Flutterwave checkout)
   */
  initializePayment: async (request: FlutterwavePaymentRequest): Promise<FlutterwavePaymentResponse> => {
    const payload = {
      ...request,
      tx_ref: request.tx_ref || generateFlwReference(),
      currency: request.currency || FLUTTERWAVE_CONFIG.CURRENCY,
      payment_options: request.payment_options || FLUTTERWAVE_CONFIG.PAYMENT_OPTIONS,
      customizations: {
        title: 'SikaRemit',
        description: 'Deposit to SikaRemit Wallet',
        logo: 'https://sikaremit.com/logo.png',
        ...request.customizations,
      },
    };

    const response = await api.post(ENDPOINTS.WALLET.DEPOSIT_CARD, {
      ...payload,
      provider: 'flutterwave',
    });
    return response.data;
  },

  /**
   * Initialize Mobile Money payment (Ghana)
   * Supports MTN, Vodafone, AirtelTigo
   */
  initializeMobileMoneyPayment: async (
    email: string,
    amount: number,
    phoneNumber: string,
    network: 'MTN' | 'VODAFONE' | 'TIGO',
    voucher?: string,
    meta?: Record<string, any>
  ): Promise<FlutterwaveMobileMoneyResponse> => {
    const payload: FlutterwaveMobileMoneyRequest = {
      tx_ref: generateFlwReference(),
      amount,
      currency: FLUTTERWAVE_CONFIG.CURRENCY,
      email,
      phone_number: phoneNumber.replace(/\s/g, ''),
      network,
      voucher, // Required for Vodafone Cash
      meta: {
        ...meta,
        payment_type: 'mobile_money_deposit',
        platform: 'mobile',
      },
    };

    const response = await api.post(ENDPOINTS.WALLET.DEPOSIT_MOBILE_MONEY, {
      ...payload,
      provider: 'flutterwave',
    });
    return response.data;
  },

  /**
   * Initialize Bank Transfer payment
   * Returns virtual account details
   */
  initializeBankTransfer: async (
    email: string,
    amount: number,
    phoneNumber?: string,
    narration?: string
  ): Promise<FlutterwaveBankTransferResponse> => {
    const payload: FlutterwaveBankTransferRequest = {
      tx_ref: generateFlwReference(),
      amount,
      email,
      phone_number: phoneNumber,
      currency: FLUTTERWAVE_CONFIG.CURRENCY,
      narration: narration || 'SikaRemit Deposit',
      is_permanent: false,
      meta: {
        payment_type: 'bank_transfer_deposit',
        platform: 'mobile',
      },
    };

    const response = await api.post(ENDPOINTS.WALLET.DEPOSIT_BANK_TRANSFER, {
      ...payload,
      provider: 'flutterwave',
    });
    return response.data;
  },

  /**
   * Charge card directly (requires PCI DSS compliance)
   */
  chargeCard: async (request: FlutterwaveChargeCardRequest): Promise<FlutterwaveVerifyResponse> => {
    const payload = {
      ...request,
      tx_ref: request.tx_ref || generateFlwReference(),
      currency: request.currency || FLUTTERWAVE_CONFIG.CURRENCY,
    };

    const response = await api.post(ENDPOINTS.PAYMENTS.PROCESS, {
      ...payload,
      provider: 'flutterwave',
      action: 'charge_card',
    });
    return response.data;
  },

  /**
   * Charge saved card using token
   */
  chargeWithToken: async (
    token: string,
    email: string,
    amount: number,
    meta?: Record<string, any>
  ): Promise<FlutterwaveVerifyResponse> => {
    const payload = {
      token,
      email,
      amount,
      currency: FLUTTERWAVE_CONFIG.CURRENCY,
      tx_ref: generateFlwReference(),
      meta: {
        ...meta,
        platform: 'mobile',
      },
    };

    const response = await api.post(ENDPOINTS.PAYMENTS.PROCESS, {
      ...payload,
      provider: 'flutterwave',
      action: 'tokenized_charge',
    });
    return response.data;
  },

  /**
   * Verify transaction by reference
   */
  verifyTransaction: async (txRef: string): Promise<FlutterwaveVerifyResponse> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.TRANSACTIONS}/${txRef}/verify/?provider=flutterwave`);
    return response.data;
  },

  /**
   * Verify transaction by ID
   */
  verifyTransactionById: async (transactionId: number): Promise<FlutterwaveVerifyResponse> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.TRANSACTIONS}/${transactionId}/?provider=flutterwave`);
    return response.data;
  },

  /**
   * Validate OTP for mobile money (Vodafone)
   */
  validateMobileMoneyOTP: async (flwRef: string, otp: string): Promise<FlutterwaveVerifyResponse> => {
    const response = await api.post(ENDPOINTS.PAYMENTS.PROCESS, {
      flw_ref: flwRef,
      otp,
      provider: 'flutterwave',
      action: 'validate_otp',
    });
    return response.data;
  },

  /**
   * Validate PIN for card payment
   */
  validateCardPIN: async (flwRef: string, pin: string): Promise<FlutterwaveVerifyResponse> => {
    const response = await api.post(ENDPOINTS.PAYMENTS.PROCESS, {
      flw_ref: flwRef,
      pin,
      provider: 'flutterwave',
      action: 'validate_pin',
    });
    return response.data;
  },

  /**
   * Get saved cards for user
   */
  getSavedCards: async (): Promise<FlutterwaveSavedCard[]> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.METHODS}?provider=flutterwave&type=card`);
    return response.data.data || [];
  },

  /**
   * Delete saved card token
   */
  deleteSavedCard: async (token: string): Promise<void> => {
    await api.delete(`${ENDPOINTS.PAYMENTS.METHODS}/${token}/?provider=flutterwave`);
  },

  /**
   * Get supported banks for bank transfer
   */
  getBanks: async (country: string = 'GH'): Promise<Array<{
    id: number;
    code: string;
    name: string;
  }>> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.AVAILABLE_METHODS}?provider=flutterwave&country=${country}&type=bank`);
    return response.data.data || [];
  },

  /**
   * Create a transfer (payout)
   */
  createTransfer: async (
    accountBank: string,
    accountNumber: string,
    amount: number,
    narration: string,
    beneficiaryName: string,
    currency?: string
  ): Promise<{
    status: string;
    message: string;
    data: {
      id: number;
      account_number: string;
      bank_code: string;
      full_name: string;
      created_at: string;
      currency: string;
      amount: number;
      fee: number;
      status: string;
      reference: string;
      narration: string;
    };
  }> => {
    const response = await api.post(ENDPOINTS.PAYMENTS.SEND, {
      account_bank: accountBank,
      account_number: accountNumber,
      amount,
      narration,
      currency: currency || FLUTTERWAVE_CONFIG.CURRENCY,
      reference: generateFlwReference(),
      beneficiary_name: beneficiaryName,
      provider: 'flutterwave',
    });
    return response.data;
  },

  /**
   * Get transfer fee
   */
  getTransferFee: async (amount: number, currency?: string): Promise<{
    status: string;
    data: Array<{
      fee_type: string;
      currency: string;
      fee: number;
    }>;
  }> => {
    const response = await api.get(
      `${ENDPOINTS.PAYMENTS.AVAILABLE_METHODS}?provider=flutterwave&action=transfer_fee&amount=${amount}&currency=${currency || FLUTTERWAVE_CONFIG.CURRENCY}`
    );
    return response.data;
  },

  /**
   * Initiate refund
   */
  initiateRefund: async (
    transactionId: number,
    amount?: number
  ): Promise<{
    status: string;
    message: string;
    data: {
      id: number;
      amount_refunded: number;
      status: string;
      destination: string;
      created_at: string;
    };
  }> => {
    const response = await api.post(`${ENDPOINTS.PAYMENTS.TRANSACTIONS}/${transactionId}/refund/`, {
      amount,
      provider: 'flutterwave',
    });
    return response.data;
  },

  /**
   * Get Flutterwave public key from backend
   */
  getPublicKey: async (): Promise<string> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.AVAILABLE_METHODS}?provider=flutterwave&key_type=public`);
    return response.data.public_key || FLUTTERWAVE_CONFIG.PUBLIC_KEY;
  },
};

export default flutterwaveService;
