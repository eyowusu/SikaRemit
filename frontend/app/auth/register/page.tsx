'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { register } from '@/lib/api/auth'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // User type is always Customer for public registration
    // Admin and Merchant accounts are created by administrators only
  }

  const handleGoogleRegister = async () => {
    try {
      // Redirect to backend Google OAuth endpoint with callback URL
      const frontendUrl = window.location.origin
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/accounts/google/?callback_url=${encodeURIComponent(frontendUrl)}`
    } catch (error) {
      console.error('Google sign in failed:', error)
      toast({
        title: 'Google Sign-in Failed',
        description: 'Failed to initiate Google sign-in. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        password2: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        // Remove userType - backend handles auto-identification
      })

      // Show user type information if auto-identified
      const userTypeInfo = response.data?.user_type_info
      if (userTypeInfo) {
        toast({
          title: 'Registration Successful!',
          description: `Account created as ${userTypeInfo.label}. Please check your email for verification instructions.`,
        })
      } else {
        toast({
          title: 'Registration Successful!',
          description: 'Please check your email for verification instructions.',
        })
      }

      // Redirect to email verification page or login
      window.location.href = '/auth/login'

    } catch (error: any) {
      console.error('Registration failed:', error)
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.error || 'Failed to create account. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-medium text-center">Create your account</h2>
      <p className="text-sm text-gray-600 text-center">Join sikaremit to access secure payment solutions. You'll receive an email verification link after registration.</p>
      
      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleRegister}>
          Continue with Google
        </Button>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </form>
  )
}
