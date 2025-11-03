import { useForm } from 'react-hook-form'
import { usePayment } from '@/hooks/usePayment'
import { usePaymentContext } from './PaymentContext'
import { SubscriptionUpgradeRequest } from '@/lib/types/merchant'

export function SubscriptionUpgradeForm() {
  const { paymentContext } = usePaymentContext()
  const { register, handleSubmit, formState: { errors } } = useForm<Omit<SubscriptionUpgradeRequest, 'context'>>()
  const { handlePayment, loading, error } = usePayment(paymentContext)

  const onSubmit = async (data: Omit<SubscriptionUpgradeRequest, 'context'>) => {
    await handlePayment('subscription', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Plan ID</label>
        <input 
          {...register('planId', { required: true })}
          className="border rounded p-2 w-full"
        />
        {errors.planId && <span className="text-red-500">This field is required</span>}
      </div>
      
      <div>
        <label>Payment Method ID</label>
        <input 
          {...register('paymentMethodId', { required: true })}
          className="border rounded p-2 w-full"
        />
        {errors.paymentMethodId && <span className="text-red-500">This field is required</span>}
      </div>
      
      <div>
        <label>Coupon Code (optional)</label>
        <input 
          {...register('couponCode')}
          className="border rounded p-2 w-full"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Upgrade Subscription'}
      </button>
      
      {error && <div className="text-red-500">{error.message}</div>}
    </form>
  )
}
