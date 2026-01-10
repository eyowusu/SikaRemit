/**
 * Unified Payment Gateway Abstraction Layer
 * 
 * This service provides a unified interface for all payment providers
 * (Paystack, Stripe, Flutterwave). Switch providers by changing activeProvider.
 */

import paystackService, { 
  PaystackInitializeResponse, 
  PaystackVerifyResponse,
  generateReference as generatePaystackRef 
} from './paystackService';
import stripeService, { 
  StripePaymentIntentResponse,
  StripePaymentMethod,
  generateStripeReference 
} from './stripeService';
import flutterwaveService, { 
  FlutterwavePaymentResponse, 
  FlutterwaveVerifyResponse,
  FlutterwaveMobileMoneyResponse,
  generateFlwReference 
} from './flutterwaveService';
import api from './api';
import { ENDPOINTS } from '../constants/api';

// Payment Provider Types
export type PaymentProvider = 'paystack' | 'stripe' | 'flutterwave';

// Active provider - Change this to switch payment gateways
// Options: 'paystack' | 'stripe' | 'flutterwave'
let activeProvider: PaymentProvider = 'paystack';

export const getActiveProvider = (): PaymentProvider => activeProvider;
export const setActiveProvider = (provider: PaymentProvider): void => {
  activeProvider = provider;
};

// Mobile Money Provider mapping
export type MobileMoneyProvider = 'mtn' | 'vodafone' | 'airteltigo';

const MOBILE_MONEY_PROVIDER_MAP: Record<MobileMoneyProvider, {
  paystack: 'mtn' | 'vod' | 'tgo';
  flutterwave: 'MTN' | 'VODAFONE' | 'TIGO';
}> = {
  mtn: { paystack: 'mtn', flutterwave: 'MTN' },
  vodafone: { paystack: 'vod', flutterwave: 'VODAFONE' },
  airteltigo: { paystack: 'tgo', flutterwave: 'TIGO' },
};

// Unified Response Types
export interface PaymentInitResponse {
  success: boolean;
  provider: PaymentProvider;
  reference: string;
  authorizationUrl?: string;
  clientSecret?: string; // For Stripe
  accessCode?: string; // For Paystack
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
  authorizationCode?: string; // Paystack
  token?: string; // Flutterwave
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
      case 'paystack':
        return generatePaystackRef();
      case 'stripe':
        return generateStripeReference();
      case 'flutterwave':
        return generateFlwReference();
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
        case 'paystack': {
          const response = await paystackService.initializeCardPayment({
            email,
            amount,
            reference,
            channels: ['card'],
            metadata,
          });
          return {
            success: response.status,
            provider: 'paystack',
            reference: response.data.reference,
            authorizationUrl: response.data.authorization_url,
            accessCode: response.data.access_code,
            message: response.message,
            data: response.data,
          };
        }

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

        case 'flutterwave': {
          const response = await flutterwaveService.initializePayment({
            tx_ref: reference,
            amount,
            customer: { email },
            payment_options: 'card',
            meta: metadata,
          });
          return {
            success: response.status === 'success',
            provider: 'flutterwave',
            reference: response.data.tx_ref,
            authorizationUrl: response.data.link,
            message: response.message,
            data: response.data,
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
      switch (activeProvider) {
        case 'paystack': {
          const paystackProvider = MOBILE_MONEY_PROVIDER_MAP[provider].paystack;
          const response = await paystackService.initializeMobileMoneyPayment(
            email,
            amount,
            phoneNumber,
            paystackProvider,
            metadata
          );
          return {
            success: response.status,
            provider: 'paystack',
            reference: response.data.reference,
            status: 'pending',
            message: response.message || 'A prompt has been sent to your phone',
            data: response.data,
          };
        }

        case 'flutterwave': {
          const flwProvider = MOBILE_MONEY_PROVIDER_MAP[provider].flutterwave;
          const response = await flutterwaveService.initializeMobileMoneyPayment(
            email,
            amount,
            phoneNumber,
            flwProvider,
            undefined,
            metadata
          );
          const needsOtp = response.meta?.authorization?.mode === 'otp';
          return {
            success: response.status === 'success',
            provider: 'flutterwave',
            reference,
            status: needsOtp ? 'otp_required' : 'pending',
            otpRequired: needsOtp,
            message: response.meta?.authorization?.validate_instructions || response.message,
            authUrl: response.meta?.authorization?.redirect,
            data: response.data,
          };
        }

        case 'stripe':
          // Stripe doesn't support mobile money directly in Ghana
          // Fall back to card payment or throw error
          throw new Error('Stripe does not support mobile money payments in Ghana. Please use Paystack or Flutterwave.');

        default:
          throw new Error(`Unsupported payment provider: ${activeProvider}`);
      }
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
      switch (activeProvider) {
        case 'paystack': {
          const response = await paystackService.initializeBankTransfer(email, amount, metadata);
          return {
            success: true,
            provider: 'paystack',
            reference,
            bankDetails: response.data?.bank_details,
            message: 'Bank transfer initiated',
          };
        }

        case 'flutterwave': {
          const response = await flutterwaveService.initializeBankTransfer(email, amount);
          const auth = response.meta?.authorization;
          return {
            success: response.status === 'success',
            provider: 'flutterwave',
            reference: auth?.transfer_reference || reference,
            bankDetails: auth ? {
              bankName: auth.transfer_bank,
              accountNumber: auth.transfer_account,
              accountName: 'SikaRemit',
              expiresAt: auth.account_expiration,
              reference: auth.transfer_reference,
            } : undefined,
            message: auth?.transfer_note || response.message,
          };
        }

        case 'stripe':
          // Stripe bank transfers work differently
          throw new Error('Bank transfer not supported with Stripe in this region');

        default:
          throw new Error(`Unsupported payment provider: ${activeProvider}`);
      }
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
        case 'paystack': {
          const response = await paystackService.verifyTransaction(reference);
          return {
            success: response.data.status === 'success',
            provider: 'paystack',
            reference: response.data.reference,
            status: response.data.status as any,
            amount: response.data.amount / 100,
            currency: response.data.currency,
            channel: response.data.channel,
            paidAt: response.data.paid_at,
            customer: {
              email: response.data.customer.email,
              name: `${response.data.customer.first_name} ${response.data.customer.last_name}`.trim(),
              phone: response.data.customer.phone,
            },
            fees: response.data.fees / 100,
            message: response.data.gateway_response,
            data: response.data,
          };
        }

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

        case 'flutterwave': {
          const response = await flutterwaveService.verifyTransaction(reference);
          return {
            success: response.data.status === 'successful',
            provider: 'flutterwave',
            reference: response.data.tx_ref,
            status: response.data.status === 'successful' ? 'success' : 
                   response.data.status === 'failed' ? 'failed' : 'pending',
            amount: response.data.amount,
            currency: response.data.currency,
            channel: response.data.payment_type,
            paidAt: response.data.created_at,
            customer: {
              email: response.data.customer.email,
              name: response.data.customer.name,
              phone: response.data.customer.phone_number,
            },
            fees: response.data.app_fee,
            message: response.data.processor_response,
            data: response.data,
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
        case 'paystack': {
          const cards = await paystackService.getSavedCards();
          return cards.map(card => ({
            id: card.authorization_code,
            provider: 'paystack',
            last4: card.last4,
            brand: card.brand,
            expMonth: card.exp_month,
            expYear: card.exp_year,
            bank: card.bank,
            reusable: card.reusable,
            authorizationCode: card.authorization_code,
          }));
        }

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

        case 'flutterwave': {
          const cards = await flutterwaveService.getSavedCards();
          return cards.map(card => ({
            id: card.token,
            provider: 'flutterwave',
            last4: card.last_4digits,
            brand: card.type,
            expMonth: card.expiry.split('/')[0] || '',
            expYear: card.expiry.split('/')[1] || '',
            bank: card.issuer,
            reusable: true,
            token: card.token,
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
        case 'paystack': {
          if (!card.authorizationCode) throw new Error('Missing authorization code');
          const response = await paystackService.chargeAuthorization(
            email,
            amount,
            card.authorizationCode,
            metadata
          );
          return {
            success: response.data.status === 'success',
            provider: 'paystack',
            reference: response.data.reference,
            status: response.data.status as any,
            amount: response.data.amount / 100,
            currency: response.data.currency,
            channel: response.data.channel,
            customer: { email },
            message: response.data.gateway_response,
            data: response.data,
          };
        }

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

        case 'flutterwave': {
          if (!card.token) throw new Error('Missing card token');
          const response = await flutterwaveService.chargeWithToken(
            card.token,
            email,
            amount,
            metadata
          );
          return {
            success: response.data.status === 'successful',
            provider: 'flutterwave',
            reference: response.data.tx_ref,
            status: response.data.status === 'successful' ? 'success' : 'failed',
            amount: response.data.amount,
            currency: response.data.currency,
            channel: response.data.payment_type,
            customer: { email },
            message: response.data.processor_response,
            data: response.data,
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
        case 'paystack':
          if (card.authorizationCode) {
            await paystackService.deleteSavedCard(card.authorizationCode);
          }
          break;
        case 'stripe':
          if (card.paymentMethodId) {
            await stripeService.deletePaymentMethod(card.paymentMethodId);
          }
          break;
        case 'flutterwave':
          if (card.token) {
            await flutterwaveService.deleteSavedCard(card.token);
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
   * Validate mobile money OTP (Flutterwave only)
   */
  validateMobileMoneyOTP: async (
    reference: string,
    otp: string
  ): Promise<PaymentVerifyResponse> => {
    if (activeProvider !== 'flutterwave') {
      throw new Error('OTP validation is only supported with Flutterwave');
    }

    try {
      const response = await flutterwaveService.validateMobileMoneyOTP(reference, otp);
      return {
        success: response.data.status === 'successful',
        provider: 'flutterwave',
        reference: response.data.tx_ref,
        status: response.data.status === 'successful' ? 'success' : 'failed',
        amount: response.data.amount,
        currency: response.data.currency,
        channel: response.data.payment_type,
        customer: {
          email: response.data.customer.email,
          name: response.data.customer.name,
          phone: response.data.customer.phone_number,
        },
        message: response.data.processor_response,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'flutterwave',
        reference,
        status: 'failed',
        amount: 0,
        currency: 'GHS',
        channel: 'mobile_money',
        customer: { email: '' },
        message: error.response?.data?.message || error.message || 'OTP validation failed',
      };
    }
  },

  /**
   * Get public key for client-side SDK initialization
   */
  getPublicKey: async (): Promise<string> => {
    switch (activeProvider) {
      case 'paystack':
        // Fetch from backend for security
        const paystackResponse = await api.get(`${ENDPOINTS.PAYMENTS.AVAILABLE_METHODS}?provider=paystack&key_type=public`);
        return paystackResponse.data.public_key;
      case 'stripe':
        return stripeService.getPublishableKey();
      case 'flutterwave':
        return flutterwaveService.getPublicKey();
      default:
        throw new Error('Unknown provider');
    }
  },
};

export default paymentGateway;
