import { useForm } from 'react-hook-form'
import { usePaymentContext } from './PaymentContext'
import { usePayment } from '@/hooks/usePayment'
import { MerchantPaymentLimits } from '@/lib/types/merchant'
import { formatCurrency } from '@/lib/utils/currency'

type BillPaymentFormProps = {
  limits?: MerchantPaymentLimits
}

type FormData = {
  billIssuer: string
  billReference: string
  dueDate: string
  amount: number
  paymentMethodId: string
}

const SUGGESTED_AMOUNTS = [10, 20, 50, 100] as const

export function BillPaymentForm({ limits }: BillPaymentFormProps) {
  const { merchant, paymentContext } = usePaymentContext()
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>()
  const { handlePayment, loading, error, setError } = usePayment(paymentContext, limits)
  const currentBalance = merchant.balance ?? 0

  const onSubmit = async (data: FormData) => {
    if (data.billIssuer === merchant.businessName) {
      setError({ message: "Cannot pay bill to yourself" })
      return
    }
    
    if (currentBalance < data.amount) {
      setError({ 
        message: `Insufficient balance (Current: ${formatCurrency(currentBalance, limits?.currency || 'USD')}, Needed: ${formatCurrency(data.amount, limits?.currency || 'USD')})` 
      })
      return
    }
    
    if (data.amount > 1000 && !confirm(`Confirm large bill payment of ${formatCurrency(data.amount, limits?.currency || 'USD')}?`)) {
      return
    }
    
    try {
      await handlePayment('bill', data)
      // Clear any previous errors on success
      setError(null)
    } catch (err) {
      // Errors are already handled by usePayment
    }
  }

  const setSuggestedAmount = (amount: number) => {
    setValue('amount', amount, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true 
    })
  }

return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Bill Issuer</label>
        <input 
          {...register('billIssuer', { 
            required: "Bill issuer is required",
            validate: (value) => value !== merchant.businessName || "Cannot pay bill to yourself"
          })}
          className="border rounded p-2 w-full"
        />
        {errors.billIssuer && <span className="text-red-500">{errors.billIssuer.message}</span>}
      </div>
      
      <div>
        <label>Bill Reference</label>
        <input 
          {...register('billReference', { required: "Bill reference is required" })}
          className="border rounded p-2 w-full"
        />
        {errors.billReference && <span className="text-red-500">{errors.billReference.message}</span>}
      </div>
      
      <div>
        <label>Due Date</label>
        <input 
          type="date"
          {...register('dueDate', { required: "Due date is required" })}
          className="border rounded p-2 w-full"
        />
        {errors.dueDate && <span className="text-red-500">{errors.dueDate.message}</span>}
      </div>
      
      <div>
        <label>Amount ({limits?.currency || 'USD'})</label>
        <input 
          type="number"
          {...register('amount', { 
            required: "Amount is required",
            min: { value: 1, message: "Minimum amount is 1" },
            max: limits ? { 
              value: limits.maxAmount, 
              message: `Max amount is ${formatCurrency(limits.maxAmount, limits?.currency || 'USD')}`
            } : undefined,
            valueAsNumber: true
          })}
          className="border rounded p-2 w-full"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {SUGGESTED_AMOUNTS.map(amount => (
            <button
              key={amount}
              type="button"
              onClick={() => setSuggestedAmount(amount)}
              disabled={amount > currentBalance}
              className={`text-sm px-3 py-1 rounded transition-colors ${
                amount > currentBalance 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {formatCurrency(amount, limits?.currency || 'USD')}
            </button>
          ))}
        </div>
        {errors.amount && <span className="text-red-500">{errors.amount.message}</span>}
      </div>
      
      <div>
        <label>Payment Method</label>
        <input 
          {...register('paymentMethodId', { 
            required: "Payment method is required",
            validate: (value) => 
              !limits || limits.allowedMethods.includes(value) || 
              `Method not allowed (Allowed: ${limits.allowedMethods.join(', ')})`
          })}
          className="border rounded p-2 w-full"
        />
        {errors.paymentMethodId && <span className="text-red-500">{errors.paymentMethodId.message}</span>}
      </div>
      
      <div className="pt-2">
        <p className="text-sm">
          Available balance: {formatCurrency(currentBalance, limits?.currency || 'USD')}
          {watch('amount') > 0 && (
            <span className="block mt-1">
              Remaining: {formatCurrency(currentBalance - watch('amount'), limits?.currency || 'USD')}
            </span>
          )}
        </p>
      </div>
      
      <div className="relative">
        <button 
          type="submit" 
          disabled={loading}
          className={`bg-blue-500 text-white p-2 rounded w-full transition-opacity ${
            loading ? 'opacity-75' : 'hover:bg-blue-600'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : 'Pay Bill'}
        </button>
        {loading && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-25 rounded pointer-events-none"></div>
        )}
      </div>
      
      {error && <div className="text-red-500 p-2 bg-red-50 rounded">{error.message}</div>}
    </form>
  )
}
