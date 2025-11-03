import { createContext, useContext } from 'react'
import { Merchant, PaymentContext } from '@/lib/types/merchant'

type PaymentProviderProps = {
  merchant: Merchant
  children: React.ReactNode
}

const Context = createContext<{
  merchant: Merchant
  paymentContext: PaymentContext
} | null>(null)

export function PaymentProvider({ merchant, children }: PaymentProviderProps) {
  const paymentContext: PaymentContext = {
    merchantId: merchant.id,
    defaultPayoutMethod: merchant.default_payout_method?.id || undefined,
    businessName: merchant.businessName,
    isVerified: merchant.verificationStatus === 'verified'
  }

  return (
    <Context.Provider value={{ merchant, paymentContext }}>
      {children}
    </Context.Provider>
  )
}

export function usePaymentContext() {
  const context = useContext(Context)
  if (!context) {
    throw new Error('usePaymentContext must be used within a PaymentProvider')
  }
  return context
}
