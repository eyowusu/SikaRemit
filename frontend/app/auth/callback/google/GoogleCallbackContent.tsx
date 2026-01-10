'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { googleOAuthCallback } from '@/lib/api/auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(true)
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        if (!code) {
          throw new Error('No authorization code received')
        }

        // Exchange the code for tokens using the API function
        const tokens = await googleOAuthCallback(code)
        localStorage.setItem('access_token', tokens.access)
        localStorage.setItem('refresh_token', tokens.refresh)

        // Set user data in auth context
        const userData = {
          id: tokens.user.id,
          email: tokens.user.email,
          first_name: tokens.user.first_name,
          last_name: tokens.user.last_name,
          role: tokens.user.role,
        }

        // Trigger login in auth context (this will update the user state)
        // Note: We'll refresh the page to trigger auth context update
        toast({
          title: 'Success',
          description: 'Successfully signed in with Google!',
        })

        // Redirect based on user role - SOCIAL LOGIN IS FOR CUSTOMERS ONLY
        if (tokens.user.role === 'customer') {
          router.push('/customer')
        } else {
          // Non-customers cannot use social login for security reasons
          toast({
            title: 'Access Denied',
            description: 'Social login is available for customers only. Please contact support for other account types.',
            variant: 'destructive',
          })
          router.push('/auth')
          return
        }
      } catch (error: any) {
        console.error('Google OAuth callback error:', error)

        // Check if it's a configuration error
        if (error.message && error.message.includes('not configured')) {
          toast({
            title: 'Google Sign-in Unavailable',
            description: 'Google OAuth is not configured on this server. Please use email and password to sign in.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Authentication Failed',
            description: error.message || 'Failed to complete Google sign-in',
            variant: 'destructive',
          })
        }
        router.push('/auth')
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [searchParams, router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">
          {isProcessing ? 'Completing sign-in...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  )
}
