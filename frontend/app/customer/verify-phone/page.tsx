'use client'

import { useRouter } from 'next/navigation'
import { SMSVerification } from '@/components/verification/sms-verification'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VerifyPhonePage() {
  const router = useRouter()

  const handleVerified = () => {
    // Redirect to profile or dashboard after verification
    router.push('/customer/profile?verified=true')
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Verify Your Phone Number</h1>
          <p className="text-muted-foreground">
            We'll send you a verification code to confirm your phone number
          </p>
        </div>

        <SMSVerification
          onVerified={handleVerified}
          onCancel={handleCancel}
        />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>By verifying your phone number, you agree to receive SMS notifications</p>
          <p className="mt-2">Standard message and data rates may apply</p>
        </div>
      </div>
    </div>
  )
}
