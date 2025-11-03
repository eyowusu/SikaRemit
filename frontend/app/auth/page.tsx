import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { SocialAuth } from '@/components/auth/social-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Authentication | PayGlobe',
}

export default async function AuthPage({
  searchParams
}: {
  searchParams: { mode?: string; verified?: string; error?: string }
}) {
  const params = await searchParams
  const mode = params?.mode || 'login'
  const isVerified = params?.verified === 'check'
  const error = params?.error

  if (isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-payglobe-card">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-payglobe-foreground">Check Your Email</h1>
              <p className="text-payglobe-muted">
                We've sent you a verification email. Please check your inbox and click the link to verify your account.
              </p>
              <a href="/auth" className="inline-flex items-center px-4 py-2 bg-payglobe-primary text-white rounded-md hover:bg-payglobe-primary/90 transition-colors">
                Back to Login
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-payglobe-card">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-payglobe-foreground">
            {mode === 'register' ? 'Create Account' : mode === 'forgot-password' ? 'Reset Password' : 'Welcome Back'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === 'register' ? (
            <>
              <RegisterForm />
              <SocialAuth />
              <div className="text-center">
                <p className="text-sm">
                  Already have an account?{' '}
                  <a href="/auth" className="text-payglobe-primary hover:underline">
                    Sign In
                  </a>
                </p>
              </div>
            </>
          ) : mode === 'forgot-password' ? (
            <>
              <ForgotPasswordForm />
              <div className="text-center">
                <p className="text-sm">
                  Remember your password?{' '}
                  <a href="/auth" className="text-payglobe-primary hover:underline">
                    Back to Sign In
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              {error && (
                <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
                  {error === 'unauthorized' ? 'Access denied. Please sign in.' : 'Authentication failed.'}
                </div>
              )}
              <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
                <LoginForm />
              </Suspense>
              {/* <SocialAuth /> */}
              <div className="text-center">
                <p className="text-sm">
                  Don't have an account?{' '}
                  <a href="/auth?mode=register" className="text-payglobe-primary hover:underline">
                    Create Account
                  </a>
                </p>
                <p className="text-sm mt-2">
                  <a href="/auth?mode=forgot-password" className="text-payglobe-primary hover:underline">
                    Forgot Password?
                  </a>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
