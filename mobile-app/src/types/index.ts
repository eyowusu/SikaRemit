export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  avatar?: string;
  is_verified: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface Wallet {
  id: string;
  balance: number;
  currency: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'bill_payment' | 'remittance' | 'topup';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  recipient?: {
    name: string;
    phone?: string;
    email?: string;
  };
  sender?: {
    name: string;
    phone?: string;
    email?: string;
  };
  description?: string;
  reference: string;
  fee: number;
  created_at: string;
  completed_at?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'bank_account';
  name: string;
  last_four?: string;
  provider?: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Bill {
  id: string;
  type: 'electricity' | 'water' | 'internet' | 'tv' | 'tax' | 'other';
  provider: string;
  account_number: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'transaction' | 'security' | 'promotion' | 'system';
  is_read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export interface Country {
  code: string;
  name: string;
  dial_code: string;
  flag: string;
  currency: string;
}

export interface TelecomProvider {
  id: string;
  name: string;
  logo: string;
  country_code: string;
}

export interface DataPackage {
  id: string;
  name: string;
  data_amount: string;
  validity: string;
  price: number;
  currency: string;
}

export interface KYCDocument {
  id: string;
  type: 'passport' | 'national_id' | 'drivers_license' | 'utility_bill';
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
  BiometricSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Payments: undefined;
  History: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  QRScanner: undefined;
};

export type PaymentsStackParamList = {
  PaymentsHome: undefined;
  Deposit: undefined;
  SendMoney: undefined;
  RequestMoney: undefined;
  BillPayment: undefined;
  BillPaymentDetails: { bill: Bill };
  Airtime: undefined;
  DataBundle: undefined;
  Remittance: undefined;
  PaymentConfirmation: { transaction: Transaction };
  PaymentSuccess: { transaction: Transaction };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  KYCVerification: undefined;
  PaymentMethods: undefined;
  AddPaymentMethod: undefined;
  Security: undefined;
  Settings: undefined;
  Support: undefined;
  CreateTicket: undefined;
  TicketDetails: { ticket: SupportTicket };
};
