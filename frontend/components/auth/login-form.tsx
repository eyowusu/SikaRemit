'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export function LoginForm({ userType = 'customer' }: { userType?: 'customer' | 'merchant' | 'admin' }) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async () => {
    console.log('🚀 LoginForm: handleLogin started')
    console.log('🚀 LoginForm: Current location:', window.location.href)
    console.log('🚀 LoginForm: Email:', email, 'Password length:', password.length)

    if (!email || !password) {
      console.log('⚠️ LoginForm: Missing email or password')
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive'
      })
      return
    }

    console.log('🔐 LoginForm: Calling auth context login...')
    setIsLoggingIn(true)
    try {
      console.log('🔐 LoginForm: About to call login function')
      const role = await login(email, password)
      console.log('✅ LoginForm: Login successful, role returned:', role)
      console.log('✅ LoginForm: Role type:', typeof role)
      console.log('✅ LoginForm: Role value:', JSON.stringify(role))

      toast({
        title: 'Login Successful',
        description: 'Redirecting to dashboard...',
      })
      
      // Handle redirect based on role
      const redirectPath = {
        admin: '/admin/overview',
        merchant: '/merchant/dashboard',
        customer: '/customer/dashboard'
      }[role] || '/customer/dashboard'
      
      console.log('🔄 LoginForm: Role mapping result:', redirectPath)
      console.log('🔄 LoginForm: About to redirect to:', redirectPath)
      console.log('🔄 LoginForm: Current pathname:', window.location.pathname)
      
      // Use Next.js router for reliable navigation
      console.log('🔄 LoginForm: Calling window.location.href with:', redirectPath)
      window.location.href = redirectPath
      
      console.log('✅ LoginForm: Router navigation initiated')
      console.log('✅ LoginForm: Navigation should be complete')
    } catch (error: any) {
      console.error('❌ LoginForm: Login failed:', error)
      console.error('❌ LoginForm: Error details:', error.response?.data, error.message)
      const errorMessage = error.response?.data?.error ||
                           error.response?.data?.non_field_errors?.[0] ||
                           error.response?.data?.detail ||
                           error.message ||
                           'Invalid credentials';
      console.error('❌ LoginForm: Error message:', errorMessage)
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive'
      })
      // IMPORTANT: Do NOT redirect on login failure - stay on current page
      // This ensures admin login failures stay on admin portal, not customer/merchant pages
    } finally {
      console.log('🔄 LoginForm: Setting isLoggingIn to false')
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      </div>

      <Button
        onClick={handleLogin}
        disabled={isLoggingIn || !email || !password}
        className="w-full"
      >
        {isLoggingIn ? 'Logging in...' : 'Login'}
      </Button>

    </div>
  )
}
