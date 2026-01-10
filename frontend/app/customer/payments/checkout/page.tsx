'use client'

import { UnifiedCheckout } from '@/components/payments/unified-checkout'
import { TransactionContext } from '@/lib/types/payments'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [transactionContext, setTransactionContext] = useState<TransactionContext | null>(null)

  useEffect(() => {
    // Parse URL parameters for transaction details
    const merchantId = searchParams.get('merchant') || '1'
    const amount = parseFloat(searchParams.get('amount') || '0')
    const description = searchParams.get('description') || 'Payment checkout'
    const currency = searchParams.get('currency') || 'GHS'

    setTransactionContext({
      type: 'merchant_checkout',
      amount,
      currency,
      description,
      merchantDetails: {
        merchantId
      }
    })
  }, [searchParams])

  const handlePaymentSuccess = (result: any) => {
    router.push('/customer/payments/success')
  }

  if (!transactionContext) {
    return <div>Loading...</div>
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
            <h1 className="text-3xl font-bold">Complete Payment</h1>
            <p className="text-muted-foreground">Review and complete your payment</p>
          </div>
        </div>

        <UnifiedCheckout
          transactionContext={transactionContext}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageContent />
    </Suspense>
  )
}
