import api from './api';
import { ENDPOINTS } from '../constants/api';

// Stripe configuration
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  MERCHANT_ID: 'merchant.com.sikaremit',
  CURRENCY: 'GHS',
  COUNTRY: 'GH',
};

// Types
export interface StripePaymentIntentRequest {
  amount: number; // Amount in pesewas (smallest currency unit)
  currency?: string;
  payment_method_types?: string[];
  customer_email?: string;
  description?: string;
  metadata?: Record<string, string>;
  receipt_email?: string;
}

export interface StripePaymentIntentResponse {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  created: number;
  payment_method_types: string[];
}

export interface StripePaymentMethodRequest {
  type: 'card';
  card: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
  };
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding: string;
  };
  billing_details: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  created: number;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  phone: string;
  default_source: string | null;
  metadata: Record<string, string>;
}

export interface StripeChargeResponse {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  paid: boolean;
  receipt_url: string;
  payment_method: string;
  created: number;
}

// Generate unique reference for Stripe
export const generateStripeReference = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `sika_stripe_${timestamp}_${random}`;
};

// Stripe Service
const stripeService = {
  /**
   * Create a Payment Intent for card payment
   * This is the recommended way to handle payments with Stripe
   */
  createPaymentIntent: async (request: StripePaymentIntentRequest): Promise<StripePaymentIntentResponse> => {
    const payload = {
      amount: Math.round(request.amount * 100), // Convert to pesewas
      currency: request.currency || STRIPE_CONFIG.CURRENCY,
      payment_method_types: request.payment_method_types || ['card'],
      description: request.description || 'SikaRemit Deposit',
      metadata: {
        ...request.metadata,
        reference: generateStripeReference(),
        platform: 'mobile',
      },
      receipt_email: request.receipt_email,
    };

    const response = await api.post(`${ENDPOINTS.WALLET.DEPOSIT_CARD}`, {
      ...payload,
      provider: 'stripe',
    });
    return response.data;
  },

  /**
   * Confirm a Payment Intent with payment method
   */
  confirmPaymentIntent: async (
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<StripePaymentIntentResponse> => {
    const response = await api.post(`${ENDPOINTS.PAYMENTS.PROCESS}`, {
      payment_intent_id: paymentIntentId,
      payment_method_id: paymentMethodId,
      provider: 'stripe',
    });
    return response.data;
  },

  /**
   * Create a Setup Intent for saving card without charging
   */
  createSetupIntent: async (customerEmail: string): Promise<{
    id: string;
    client_secret: string;
    status: string;
  }> => {
    const response = await api.post(`${ENDPOINTS.PAYMENTS.METHODS}`, {
      action: 'setup_intent',
      email: customerEmail,
      provider: 'stripe',
    });
    return response.data;
  },

  /**
   * Attach a payment method to customer
   */
  attachPaymentMethod: async (paymentMethodId: string): Promise<StripePaymentMethod> => {
    const response = await api.post(`${ENDPOINTS.PAYMENTS.METHODS}`, {
      action: 'attach',
      payment_method_id: paymentMethodId,
      provider: 'stripe',
    });
    return response.data;
  },

  /**
   * Get saved payment methods for customer
   */
  getPaymentMethods: async (): Promise<StripePaymentMethod[]> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.METHODS}?provider=stripe&type=card`);
    return response.data.data || [];
  },

  /**
   * Delete a saved payment method
   */
  deletePaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await api.delete(`${ENDPOINTS.PAYMENTS.METHODS}/${paymentMethodId}/?provider=stripe`);
  },

  /**
   * Retrieve Payment Intent status
   */
  retrievePaymentIntent: async (paymentIntentId: string): Promise<StripePaymentIntentResponse> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.TRANSACTIONS}/${paymentIntentId}/?provider=stripe`);
    return response.data;
  },

  /**
   * Create a customer in Stripe
   */
  createCustomer: async (
    email: string,
    name: string,
    phone?: string,
    metadata?: Record<string, string>
  ): Promise<StripeCustomer> => {
    const response = await api.post(`${ENDPOINTS.PAYMENTS.METHODS}`, {
      action: 'create_customer',
      email,
      name,
      phone,
      metadata,
      provider: 'stripe',
    });
    return response.data;
  },

  /**
   * Charge a saved card
   */
  chargeCard: async (
    amount: number,
    paymentMethodId: string,
    description?: string,
    metadata?: Record<string, string>
  ): Promise<StripeChargeResponse> => {
    const payload = {
      amount: Math.round(amount * 100),
      currency: STRIPE_CONFIG.CURRENCY,
      payment_method_id: paymentMethodId,
      description: description || 'SikaRemit Deposit',
      metadata: {
        ...metadata,
        reference: generateStripeReference(),
      },
      provider: 'stripe',
      confirm: true,
    };

    const response = await api.post(`${ENDPOINTS.PAYMENTS.PROCESS}`, payload);
    return response.data;
  },

  /**
   * Get Stripe publishable key from backend (for security)
   */
  getPublishableKey: async (): Promise<string> => {
    const response = await api.get(`${ENDPOINTS.PAYMENTS.AVAILABLE_METHODS}?provider=stripe&key_type=publishable`);
    return response.data.publishable_key || STRIPE_CONFIG.PUBLISHABLE_KEY;
  },

  /**
   * Create ephemeral key for Stripe SDK
   */
  createEphemeralKey: async (apiVersion: string): Promise<{
    id: string;
    secret: string;
    expires: number;
  }> => {
    const response = await api.post(`${ENDPOINTS.PAYMENTS.METHODS}`, {
      action: 'ephemeral_key',
      api_version: apiVersion,
      provider: 'stripe',
    });
    return response.data;
  },

  /**
   * Handle 3D Secure authentication result
   */
  handle3DSecureResult: async (
    paymentIntentId: string,
    result: 'success' | 'failure'
  ): Promise<StripePaymentIntentResponse> => {
    const response = await api.post(`${ENDPOINTS.PAYMENTS.PROCESS}`, {
      payment_intent_id: paymentIntentId,
      three_d_secure_result: result,
      provider: 'stripe',
    });
    return response.data;
  },

  /**
   * Create a refund for a charge
   */
  createRefund: async (
    chargeId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  ): Promise<{
    id: string;
    amount: number;
    status: string;
    charge: string;
  }> => {
    const response = await api.post(`${ENDPOINTS.PAYMENTS.TRANSACTIONS}/${chargeId}/refund/`, {
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
      provider: 'stripe',
    });
    return response.data;
  },
};

export default stripeService;
