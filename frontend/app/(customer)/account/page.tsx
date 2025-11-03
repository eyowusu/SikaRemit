import { PaymentHistory } from '@/components/customer/payment-history'
import { Receipts } from '@/components/customer/receipts'
import { DisputeForm } from '@/components/customer/dispute-form'

export default function CustomerAccount() {
  return (
    <div className="min-h-screen bg-payglobe-card space-y-6">
      <h1 className="text-2xl font-bold text-payglobe-foreground">Your Account</h1>
      <PaymentHistory />
      <Receipts />
      <DisputeForm paymentId="current-payment-id" />
    </div>
  )
}
