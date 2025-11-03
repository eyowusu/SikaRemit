'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestTwoFactor, verifyTwoFactor } from '@/lib/api/auth'
import { useToast } from '@/hooks/use-toast'

type TwoFactorProps = {
  userId: string
  phone: string
  onSuccess: () => void
}

export function TwoFactorAuth({ userId, phone, onSuccess }: TwoFactorProps) {
  const [code, setCode] = React.useState('')
  const [requestId, setRequestId] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const handleRequest = async () => {
    setIsLoading(true)
    try {
      const { requestId } = await requestTwoFactor({
        phone_number: phone
      })
      setRequestId(requestId)
      toast({
        title: 'Verification Sent',
        description: 'Check your phone for the 6-digit code'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send verification code',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!code || !requestId) return
    
    setIsLoading(true)
    try {
      await verifyTwoFactor({ requestId, code })
      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid verification code',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!requestId ? (
        <Button 
          onClick={handleRequest}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </Button>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>
          <Button 
            onClick={handleVerify}
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </>
      )}
    </div>
  )
}
