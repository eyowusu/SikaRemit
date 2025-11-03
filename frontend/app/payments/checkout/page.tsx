import { CheckoutForm } from '@/components/payments/checkout-form'

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Complete Payment</h1>
      <CheckoutForm />
    </div>
  )
}
