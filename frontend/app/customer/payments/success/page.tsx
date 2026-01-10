'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowLeft, Home, Receipt } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (countdown === 0) {
      router.push('/customer/dashboard')
    }
  }, [countdown, router])

  return (
    <div className="min-h-screen bg-sikaremit-card space-y-6 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-sikaremit-foreground">
              Payment Successful!
            </h1>
            <p className="text-xl text-sikaremit-muted">
              Your money transfer has been completed successfully
            </p>
          </div>

          {/* Success Card */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="text-green-800 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Transaction Complete
              </CardTitle>
              <CardDescription className="text-green-700">
                Your payment has been processed and sent to the recipient
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div className="space-y-2">
                  <div className="font-medium text-green-800">Transaction Status</div>
                  <div className="text-green-600">✓ Completed</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-green-800">Processing Time</div>
                  <div className="text-green-600">Instant</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-green-800">Security</div>
                  <div className="text-green-600">✓ Encrypted</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-green-800">Receipt</div>
                  <div className="text-green-600">✓ Sent to email</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-redirect Notice */}
          <div className="text-center space-y-2">
            <p className="text-sikaremit-muted">
              Redirecting to dashboard in {countdown} seconds...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/customer/dashboard" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/customer/account" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                View Transactions
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Send Another Payment
            </Button>
          </div>

          {/* Additional Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-medium text-blue-800">What happens next?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Recipient will receive the money instantly</li>
                  <li>• Transaction receipt sent to your email</li>
                  <li>• Funds are protected by sikaremit security</li>
                  <li>• 24/7 customer support available</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
