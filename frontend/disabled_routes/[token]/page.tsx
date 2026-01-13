'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Building2 } from 'lucide-react'
import Link from 'next/link'
import { merchantApi } from '@/lib/api/client-client'

interface InvitationDetails {
  id: string
  email: string
  businessName: string
  businessType?: string
  phoneNumber?: string
  notes?: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
}

export default function AcceptInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    businessAddress: '',
    taxId: '',
    acceptTerms: false
  })

  const token = params.token as string

  useEffect(() => {
    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    try {
      // Validate invitation token with API client
      const response = await merchantApi.validateInvitation(token)

      if (response.status >= 200 && response.status < 300) {
        const invitationData = response.data
        setInvitation(invitationData)

        // Pre-fill phone number if available
        if (invitationData.phone_number) {
          setFormData(prev => ({ ...prev, phoneNumber: invitationData.phone_number || '' }))
        }
      } else {
        const errorData = response.data
        if (response.status === 404) {
          throw new Error('Invalid invitation')
        } else if (response.status === 410) {
          throw new Error('Expired invitation')
        } else {
          throw new Error(errorData?.error || 'Failed to validate invitation')
        }
      }
    } catch (error: any) {
      console.error('Failed to load invitation:', error)
      // Show appropriate error based on error type
      if (error.message?.includes('Invalid')) {
        setInvitation(null) // This will show the "Invalid Invitation" UI
      } else if (error.message?.includes('Expired')) {
        setInvitation({ ...invitation, status: 'expired' } as InvitationDetails)
      } else {
        toast({
          title: 'Error Loading Invitation',
          description: 'Failed to load invitation details. Please try again.',
          variant: 'destructive'
        })
        router.push('/auth/merchant')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!invitation) return

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.password) {
      toast({
        title: 'Required Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive'
      })
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive'
      })
      return
    }

    if (!formData.acceptTerms) {
      toast({
        title: 'Terms Required',
        description: 'Please accept the terms and conditions.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Complete merchant registration via API client
      const response = await merchantApi.acceptInvitation(token, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: invitation.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        businessName: invitation.businessName,
        taxId: formData.taxId,
        businessAddress: formData.businessAddress
      })

      if (response.status >= 200 && response.status < 300) {
        const result = response.data

        toast({
          title: 'Registration Successful!',
          description: 'Your merchant account has been created. Redirecting to dashboard...',
        })

        // Redirect to merchant dashboard
        router.push('/merchant/dashboard')
      } else {
        const errorData = response.data
        throw new Error(errorData?.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      toast({
        title: 'Registration Failed',
        description: 'Failed to complete registration. Please try again or contact support.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md xl:max-w-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
              <p className="text-muted-foreground mb-4">
                This invitation link is invalid or has expired.
              </p>
              <Button onClick={() => router.push('/auth/merchant')}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md xl:max-w-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
              <p className="text-muted-foreground mb-4">
                This invitation has expired. Please contact support for a new invitation.
              </p>
              <Button onClick={() => router.push('/auth/merchant')}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md xl:max-w-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invitation Cancelled</h2>
              <p className="text-muted-foreground mb-4">
                This invitation has been cancelled. Please contact support for assistance.
              </p>
              <Button onClick={() => router.push('/auth/merchant')}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.status === 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md xl:max-w-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Already Registered</h2>
              <p className="text-muted-foreground mb-4">
                This invitation has already been used to create an account.
              </p>
              <Button onClick={() => router.push('/auth/merchant')}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100 dark:from-slate-900 dark:via-emerald-900 dark:to-teal-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl">
          {/* Back to Login */}
          <div className="mb-6">
            <Link href="/auth/merchant">
              <Button variant="ghost" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Merchant Login
              </Button>
            </Link>
          </div>

          {/* Invitation Details */}
          <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                  <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Merchant Invitation</CardTitle>
                  <CardDescription>You've been invited to join SikaRemit</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Business Name</Label>
                  <p className="text-sm text-muted-foreground">{invitation.businessName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{invitation.email}</p>
                </div>
                {invitation.businessType && (
                  <div>
                    <Label className="text-sm font-medium">Business Type</Label>
                    <p className="text-sm text-muted-foreground capitalize">{invitation.businessType}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Expires</Label>
                  <p className="text-sm text-muted-foreground">{new Date(invitation.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
              {invitation.notes && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground italic">"{invitation.notes}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Form */}
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Complete Your Registration</CardTitle>
              <CardDescription>
                Fill in your details to create your merchant account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Account Security */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Security</h3>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Information</h3>
                  <div>
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Input
                      id="businessAddress"
                      value={formData.businessAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                      placeholder="Street address, city, country"
                    />
                  </div>

                  <div>
                    <Label htmlFor="taxId">Tax ID / Business Registration Number</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="acceptTerms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Accept terms and conditions *
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        By creating an account, you agree to our{' '}
                        <Link href="/terms" className="text-emerald-600 hover:underline">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Merchant Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
