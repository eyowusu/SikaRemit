'use client'

import { Button } from '@/components/ui/button'
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      // Redirect to backend Google OAuth endpoint with callback URL
      const frontendUrl = window.location.origin
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/accounts/google/?callback_url=${encodeURIComponent(frontendUrl)}`
    } catch (error) {
      console.error('Google sign in failed:', error)
      alert('Failed to initiate Google sign-in. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-center">Welcome Back</h2>
      <p className="text-sm text-gray-600 text-center">Enter your credentials to access your dashboard</p>
      
      <LoginForm />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleGoogleLogin}
      >
        Continue with Google
      </Button>
      
      <div className="flex justify-between text-sm">
        <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
          Forgot your password?
        </Link>
        <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
          Register
        </Link>
      </div>
    </div>
  )
}
