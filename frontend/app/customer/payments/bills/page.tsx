'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BillTypeSelector } from '@/components/payments/bill-type-selector'
import { UnifiedCheckout } from '@/components/payments/unified-checkout'
import { TransactionContext } from '@/lib/types/payments'
import { ArrowLeft } from 'lucide-react'
import { payBill } from '@/lib/api/payments'

export default function BillPaymentPage() {
  const router = useRouter()

  const [selectedBillType, setSelectedBillType] = useState('')
  const [billerName, setBillerName] = useState('')
  const [billReference, setBillReference] = useState('')
  const [amount, setAmount] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)

  const handleProceedToPayment = () => {
    if (selectedBillType && billerName && billReference && amount) {
      setShowCheckout(true)
    }
  }

  const handlePaymentSuccess = (result: any) => {
    // Handle successful payment
    router.push('/customer/payments/success')
  }

  const transactionContext: TransactionContext = {
    type: 'bill_payment',
    amount: parseFloat(amount) || 0,
    description: `${selectedBillType} bill payment - ${billerName} (${billReference})`,
    billDetails: {
      billType: selectedBillType,
      billerName,
      billReference
    }
  }

  const isBillDetailsComplete = selectedBillType && billerName && billReference && amount

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setShowCheckout(false)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Complete Payment</h1>
              <p className="text-muted-foreground">Review and pay your bill</p>
            </div>
          </div>

          <UnifiedCheckout
            transactionContext={transactionContext}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowCheckout(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pay Bills</h1>
            <p className="text-muted-foreground">Pay your utility bills and services</p>
          </div>
        </div>

        <BillTypeSelector
          selectedBillType={selectedBillType}
          onBillTypeChange={setSelectedBillType}
          billerName={billerName}
          onBillerNameChange={setBillerName}
          billReference={billReference}
          onBillReferenceChange={setBillReference}
          amount={amount}
          onAmountChange={setAmount}
        />

        {isBillDetailsComplete && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <h3 className="font-medium mb-2">Ready to Pay</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your bill details are complete. Click below to proceed to payment.
              </p>
              <Button
                onClick={handleProceedToPayment}
                className="w-full"
                size="lg"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
