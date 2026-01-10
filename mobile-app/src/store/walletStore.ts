import { create } from 'zustand';
import { Wallet, Transaction, PaymentMethod, Currency, ExchangeRate } from '../types';
import { paymentService } from '../services/paymentService';

interface WalletState {
  wallets: Wallet[];
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  currencies: Currency[];
  exchangeRates: ExchangeRate[];
  selectedWallet: Wallet | null;
  isLoading: boolean;
  error: string | null;

  fetchWallets: () => Promise<void>;
  fetchTransactions: (limit?: number) => Promise<void>;
  fetchPaymentMethods: () => Promise<void>;
  fetchCurrencies: () => Promise<void>;
  fetchExchangeRates: () => Promise<void>;
  selectWallet: (wallet: Wallet) => void;
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (id: string) => void;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  transactions: [],
  paymentMethods: [],
  currencies: [],
  exchangeRates: [],
  selectedWallet: null,
  isLoading: false,
  error: null,

  fetchWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const wallets = await paymentService.getWallets();
      const defaultWallet = wallets.find((w: Wallet) => w.is_default) || wallets[0];
      set({ wallets, selectedWallet: defaultWallet, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch wallets',
      });
    }
  },

  fetchTransactions: async (limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await paymentService.getTransactions(limit);
      set({ transactions, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch transactions',
      });
    }
  },

  fetchPaymentMethods: async () => {
    set({ isLoading: true, error: null });
    try {
      const paymentMethods = await paymentService.getPaymentMethods();
      set({ paymentMethods, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch payment methods',
      });
    }
  },

  fetchCurrencies: async () => {
    try {
      const currencies = await paymentService.getCurrencies();
      set({ currencies });
    } catch (error: any) {
      console.warn('Failed to fetch currencies:', error);
    }
  },

  fetchExchangeRates: async () => {
    try {
      const exchangeRates = await paymentService.getExchangeRates();
      set({ exchangeRates });
    } catch (error: any) {
      console.warn('Failed to fetch exchange rates:', error);
    }
  },

  selectWallet: (wallet: Wallet) => {
    set({ selectedWallet: wallet });
  },

  addPaymentMethod: (method: PaymentMethod) => {
    set((state) => ({
      paymentMethods: [...state.paymentMethods, method],
    }));
  },

  removePaymentMethod: (id: string) => {
    set((state) => ({
      paymentMethods: state.paymentMethods.filter((m) => m.id !== id),
    }));
  },

  clearError: () => set({ error: null }),
}));
