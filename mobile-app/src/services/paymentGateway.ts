/**
 * Unified Payment Gateway Abstraction Layer
 * 
 * This service provides a unified interface for payment providers
 * (Stripe). Switch providers by changing activeProvider.
 */

import stripeService, { 
  StripePaymentIntentResponse,
  StripePaymentMethod,
  generateStripeReference 
} from './stripeService';
import api from './api';
import { ENDPOINTS } from '../constants/api';

// Payment Provider Types
export type PaymentProvider = 'stripe';

// Active provider - Change this to switch payment gateways
// Options: 'stripe'
let activeProvider: PaymentProvider = 'stripe';

export const getActiveProvider = (): PaymentProvider => activeProvider;
export const setActiveProvider = (provider: PaymentProvider): void => {
  activeProvider = provider;
};

// Mobile Money Provider mapping
export type MobileMoneyProvider = 'mtn' | 'vodafone' | 'airteltigo';

// Note: Mobile money payments are handled by direct integrations
// Stripe does not support mobile money in Ghana

// Unified Response Types
export interface PaymentInitResponse {
  success: boolean;
  provider: PaymentProvider;
  reference: string;
  authorizationUrl?: string;
  clientSecret?: string; // For Stripe
  accessCode?: string; // Deprecated - no longer used
  message: string;
  data?: any;
}

export interface PaymentVerifyResponse {
  success: boolean;
  provider: PaymentProvider;
  reference: string;
  status: 'success' | 'failed' | 'pending' | 'abandoned';
  amount: number;
  currency: string;
  channel: string;
  paidAt?: string;
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };
  fees?: number;
  message: string;
  data?: any;
}

export interface SavedCard {
  id: string;
  provider: PaymentProvider;
  last4: string;
  brand: string;
  expMonth: string;
  expYear: string;
  bank?: string;
  reusable: boolean;
  authorizationCode?: string; // Deprecated - no longer used
  token?: string; // Deprecated - no longer used
  paymentMethodId?: string; // Stripe
}

export interface MobileMoneyInitResponse {
  success: boolean;
  provider: PaymentProvider;
  reference: string;
  status: 'pending' | 'otp_required' | 'success';
  message: string;
  otpRequired?: boolean;
  authUrl?: string;
  data?: any;
}

// Unified Payment Gateway Service
const paymentGateway = {
  /**
   * Get the currently active payment provider
   */
  getActiveProvider: (): PaymentProvider => activeProvider,

  /**
   * Generate a unique payment reference
   */
  generateReference: (): string => {
    switch (activeProvider) {
      case 'stripe':
        return generateStripeReference();
      default:
        return `SIKA_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
  },

  /**
   * Initialize a card payment
   */
  initializeCardPayment: async (
    email: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<PaymentInitResponse> => {
    const reference = paymentGateway.generateReference();

    try {
      switch (activeProvider) {
        case 'stripe': {
          const response = await stripeService.createPaymentIntent({
            amount,
            customer_email: email,
            metadata: { ...metadata, reference },
          });
          return {
            success: true,
            provider: 'stripe',
            reference,
            clientSecret: response.client_secret,
            message: 'Payment intent created',
            data: response,
          };
        }

        default:
          throw new Error(`Unsupported payment provider: ${activeProvider}`);
      }
    } catch (error: any) {
      return {
        success: false,
        provider: activeProvider,
        reference,
        message: error.response?.data?.message || error.message || 'Payment initialization failed',
      };
    }
  },

  /**
   * Initialize a mobile money payment
   */
  initializeMobileMoneyPayment: async (
    email: string,
    amount: number,
    phoneNumber: string,
    provider: MobileMoneyProvider,
    metadata?: Record<string, any>
  ): Promise<MobileMoneyInitResponse> => {
    const reference = paymentGateway.generateReference();

    try {
      // Mobile money payments are handled by direct integrations
      // Stripe does not support mobile money in Ghana
      throw new Error('Mobile money payments are handled by direct integrations. Please use MTN, AirtelTigo, or Telecel services directly.');
    } catch (error: any) {
      return {
        success: false,
        provider: activeProvider,
        reference,
        status: 'pending',
        message: error.response?.data?.message || error.message || 'Mobile money payment failed',
      };
    }
  },

  /**
   * Initialize a bank transfer deposit
   */
  initializeBankTransfer: async (
    email: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    provider: PaymentProvider;
    reference: string;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      expiresAt?: string;
      reference: string;
    };
    message: string;
  }> => {
    const reference = paymentGateway.generateReference();

    try {
      // Bank transfers are handled by direct integration
      // Stripe bank transfers work differently and are not available in this region
      throw new Error('Bank transfer is handled by direct integration. Please use the bank transfer service directly.');
    } catch (error: any) {
      return {
        success: false,
        provider: activeProvider,
        reference,
        message: error.response?.data?.message || error.message || 'Bank transfer initialization failed',
      };
    }
  },

  /**
   * Verify a payment transaction
   */
  verifyPayment: async (reference: string): Promise<PaymentVerifyResponse> => {
    try {
      switch (activeProvider) {
        case 'stripe': {
          const response = await stripeService.retrievePaymentIntent(reference);
          return {
            success: response.status === 'succeeded',
            provider: 'stripe',
            reference: response.id,
            status: response.status === 'succeeded' ? 'success' : 
                   response.status === 'canceled' ? 'abandoned' : 'pending',
            amount: response.amount / 100,
            currency: response.currency,
            channel: 'card',
            message: `Payment ${response.status}`,
            data: response,
            customer: { email: '' },
          };
        }

        default:
          throw new Error(`Unsupported payment provider: ${activeProvider}`);
      }
    } catch (error: any) {
      return {
        success: false,
        provider: activeProvider,
        reference,
        status: 'failed',
        amount: 0,
        currency: 'GHS',
        channel: 'unknown',
        customer: { email: '' },
        message: error.response?.data?.message || error.message || 'Payment verification failed',
      };
    }
  },

  /**
   * Get saved cards for the user
   */
  getSavedCards: async (): Promise<SavedCard[]> => {
    try {
      switch (activeProvider) {
        case 'stripe': {
          const methods = await stripeService.getPaymentMethods();
          return methods.map(method => ({
            id: method.id,
            provider: 'stripe',
            last4: method.card?.last4 || '',
            brand: method.card?.brand || '',
            expMonth: String(method.card?.exp_month || ''),
            expYear: String(method.card?.exp_year || ''),
            reusable: true,
            paymentMethodId: method.id,
          }));
        }

        default:
          return [];
      }
    } catch (error) {
      console.error('Failed to get saved cards:', error);
      return [];
    }
  },

  /**
   * Charge a saved card
   */
  chargeSavedCard: async (
    card: SavedCard,
    email: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<PaymentVerifyResponse> => {
    try {
      switch (card.provider) {
        case 'stripe': {
          if (!card.paymentMethodId) throw new Error('Missing payment method ID');
          const response = await stripeService.chargeCard(
            amount,
            card.paymentMethodId,
            'SikaRemit Deposit',
            metadata as Record<string, string>
          );
          return {
            success: response.status === 'succeeded',
            provider: 'stripe',
            reference: response.id,
            status: response.status === 'succeeded' ? 'success' : 'failed',
            amount: response.amount / 100,
            currency: response.currency,
            channel: 'card',
            customer: { email },
            message: `Payment ${response.status}`,
            data: response,
          };
        }

        default:
          throw new Error(`Unsupported provider: ${card.provider}`);
      }
    } catch (error: any) {
      return {
        success: false,
        provider: card.provider,
        reference: '',
        status: 'failed',
        amount: 0,
        currency: 'GHS',
        channel: 'card',
        customer: { email },
        message: error.response?.data?.message || error.message || 'Card charge failed',
      };
    }
  },

  /**
   * Delete a saved card
   */
  deleteSavedCard: async (card: SavedCard): Promise<boolean> => {
    try {
      switch (card.provider) {
        case 'stripe':
          if (card.paymentMethodId) {
            await stripeService.deletePaymentMethod(card.paymentMethodId);
          }
          break;
      }
      return true;
    } catch (error) {
      console.error('Failed to delete saved card:', error);
      return false;
    }
  },

  /**
   * Note: Mobile money OTP validation was handled by Flutterwave
   * This method is deprecated as Flutterwave has been removed
   */
  validateMobileMoneyOTP: async (
    reference: string,
    otp: string
  ): Promise<PaymentVerifyResponse> => {
    throw new Error('Mobile money OTP validation is no longer available. Please use direct mobile money integrations.');
  },

  /**
   * Get public key for client-side SDK initialization
   */
  getPublicKey: async (): Promise<string> => {
    switch (activeProvider) {
      case 'stripe':
        return stripeService.getPublishableKey();
      default:
        throw new Error('Unknown provider');
    }
  },
};

export default paymentGateway;
