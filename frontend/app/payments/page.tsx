import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CreditCard, Send, Receipt } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Payments | PayGlobe',
}

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-payglobe-foreground">
            <CreditCard className="h-5 w-5 text-payglobe-primary" />
            Payment Flows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-payglobe-muted mb-6">
            Choose a payment flow to get started
          </p>
          <div className="flex gap-4">
            <Button variant="outline" size="lg" asChild>
              <Link href="/payments/payouts" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Payouts
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/payments/checkout" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Checkout
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
