import { useForm, useFormContext } from 'react-hook-form'
import { usePaymentContext } from './PaymentContext'
import { usePayment } from '@/hooks/usePayment'
import { MerchantPaymentLimits } from '@/lib/types/merchant'

type RemittanceFormProps = {
  limits?: MerchantPaymentLimits
}

type FormData = {
  recipientName: string
  recipientPhone: string
  recipientCountry: string
  amount: number
  currency: string
  paymentMethodId: string
  reference?: string
}

const SUGGESTED_AMOUNTS = [10, 50, 100, 200, 500] as const

export function RemittanceForm({ limits }: RemittanceFormProps) {
  const { merchant, paymentContext } = usePaymentContext()
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
  } = useForm<FormData>()
  const { handlePayment, loading, error, setError } = usePayment(paymentContext, limits)
  const currentBalance = merchant.balance ?? 0

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: limits?.currency || 'USD' 
    }).format(amount)

  const onSubmit = async (data: FormData) => {
    if (data.recipientName === merchant.businessName) {
      setError({ message: "Cannot send to yourself" })
      return
    }
    
    if (currentBalance < data.amount) {
      setError({ 
        message: `Insufficient balance (Current: ${formatCurrency(currentBalance)}, Needed: ${formatCurrency(data.amount)})` 
      })
      return
    }
    
    try {
      await handlePayment('remittance', data)
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
        <label>Recipient Name</label>
        <input 
          {...register('recipientName', { 
            required: "Recipient name is required",
            validate: (value) => value !== merchant.businessName || "Cannot send to yourself"
          })}
          className="border rounded p-2 w-full"
        />
        {errors.recipientName && <span className="text-red-500">{errors.recipientName.message}</span>}
      </div>
      
      <div>
        <label>Recipient Phone Number</label>
        <input 
          {...register('recipientPhone', { required: "Recipient phone is required" })}
          className="border rounded p-2 w-full"
        />
        {errors.recipientPhone && <span className="text-red-500">{errors.recipientPhone.message}</span>}
      </div>
      
      <div>
        <label>Recipient Country</label>
        <select 
          {...register('recipientCountry', { required: "Recipient country is required" })}
          className="border rounded p-2 w-full"
        >
          <option value="">Select Country</option>
          <option value="GH">Ghana</option>
          <option value="NG">Nigeria</option>
          <option value="KE">Kenya</option>
          <option value="ZA">South Africa</option>
          <option value="UG">Uganda</option>
          <option value="TZ">Tanzania</option>
        </select>
        {errors.recipientCountry && <span className="text-red-500">{errors.recipientCountry.message}</span>}
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
              message: `Max amount is ${formatCurrency(limits.maxAmount)}`
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
              {formatCurrency(amount)}
            </button>
          ))}
        </div>
        {errors.amount && <span className="text-red-500">{errors.amount.message}</span>}
      </div>
      
      <div>
        <label>Currency</label>
        <select 
          {...register('currency', { required: "Currency is required" })}
          className="border rounded p-2 w-full"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
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
      
      <div>
        <label>Reference (optional)</label>
        <input 
          {...register('reference')}
          className="border rounded p-2 w-full"
        />
      </div>
      
      <div className="pt-2">
        <p className="text-sm">
          Available balance: {formatCurrency(currentBalance)}
          {useFormContext().watch('amount') > 0 && (
            <span className="block mt-1">
              Remaining: {formatCurrency(currentBalance - useFormContext().watch('amount'))}
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
          ) : 'Send Remittance'}
        </button>
        {loading && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-25 rounded pointer-events-none"></div>
        )}
      </div>
      
      {error && <div className="text-red-500 p-2 bg-red-50 rounded">{error.message}</div>}
    </form>
  )
}
