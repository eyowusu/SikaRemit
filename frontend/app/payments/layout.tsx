import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CreditCard, Send, Receipt } from 'lucide-react'

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-payglobe-card">
      <div className="container py-6 space-y-6">
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
            <nav className="flex gap-4 mb-6">
              <Button variant="outline" size="sm" asChild>
                <Link href="/payments/payouts" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Payouts
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/payments/checkout" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Checkout
                </Link>
              </Button>
            </nav>
            <div className="space-y-4">
              {children}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
