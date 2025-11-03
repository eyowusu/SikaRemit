'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { sendPayment, getPaymentMethods } from '@/lib/api/payments'
import { PaymentMethod } from '@/lib/types/payments'
import { useRouter } from 'next/navigation'

export default function SendPaymentPage() {
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const methods = await getPaymentMethods()
        setPaymentMethods(methods)
        // Set default payment method if available
        const defaultMethod = methods.find(m => m.is_default)
        if (defaultMethod) {
          setPaymentMethodId(defaultMethod.id)
        }
      } catch (error) {
        console.error('Failed to load payment methods', error)
      }
    }
    loadPaymentMethods()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await sendPayment({
        amount: parseFloat(amount),
        recipient,
        description,
        paymentMethodId
      })
      router.push('/payments/success')
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Send Money</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="recipient">Recipient</Label>
          <Input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Email or phone number"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this payment for?"
          />
        </div>

        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={paymentMethodId} onValueChange={setPaymentMethodId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.method_type.replace('_', ' ').toUpperCase()}
                  {method.is_default && ' (Default)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button type="submit" disabled={isLoading || !paymentMethodId} className="w-full">
          {isLoading ? 'Sending...' : 'Send Money'}
        </Button>
      </form>
    </div>
  )
}
