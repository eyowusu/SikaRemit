'use client'

import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getPaymentMethods, sendPayment } from '@/lib/api/payments'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

type CheckoutFormData = {
  amount: number
  recipient: string
  description: string
  paymentMethodId: string
}

export function CheckoutForm() {
  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<CheckoutFormData>()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const router = useRouter()

  // Fetch payment methods on component mount
  React.useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const methods = await getPaymentMethods()
        setPaymentMethods(methods)
      } catch (error) {
        console.error('Failed to fetch payment methods:', error)
        toast({
          title: 'Error',
          description: 'Failed to load payment methods',
          variant: 'destructive'
        })
      }
    }
    
    fetchPaymentMethods()
  }, [toast])

  const onSubmit = async (data: CheckoutFormData) => {
    // Validate payment method selection
    if (!data.paymentMethodId) {
      setError('paymentMethodId', { message: 'Payment method is required' })
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await sendPayment({
        amount: data.amount,
        recipient: data.recipient,
        description: data.description,
        paymentMethodId: data.paymentMethodId
      })

      toast({
        title: 'Payment Successful',
        description: `Payment of $${data.amount} completed successfully`,
      })

      router.push('/payments?success=true')
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Payment could not be processed',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input 
          id="amount" 
          type="number" 
          step="0.01"
          placeholder="0.00"
          {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Amount must be at least $0.01' } })}
        />
        {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient</Label>
        <Input 
          id="recipient" 
          placeholder="recipient@example.com or phone number"
          {...register('recipient', { required: 'Recipient is required' })}
        />
        {errors.recipient && <p className="text-sm text-red-600">{errors.recipient.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input 
          id="description" 
          placeholder="Payment description"
          {...register('description')}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select onValueChange={(value) => setValue('paymentMethodId', value, { shouldValidate: true })}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method.id} value={method.id}>
                {method.method_type === 'credit_card' 
                  ? `Card ending in ${method.details.last4}`
                  : method.method_type === 'mobile_money'
                  ? `${method.details.provider} - ${method.details.phone_number}`
                  : method.method_type === 'bank_transfer'
                  ? `${method.details.bank_name} - ${method.details.account_number.slice(-4)}`
                  : `${method.method_type} ${method.is_default ? '(Default)' : ''}`
                }
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.paymentMethodId && <p className="text-sm text-red-600">Payment method is required</p>}
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Processing Payment...' : 'Complete Payment'}
      </Button>
    </form>
  )
}
