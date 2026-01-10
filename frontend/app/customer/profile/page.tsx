'use client'

import { useState } from 'react'
import { useSession } from '@/lib/auth/session-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Edit, Lock, Mail, Phone, RefreshCw, Save, Shield, User, X, Settings, Bell } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneNumberInput } from '@/components/ui/phone-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CountrySelector } from '@/components/ui/country-selector'
import Link from 'next/link'
import api from '@/lib/api/axios'

export default function CustomerProfile() {
  const session = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: (session?.user as any)?.first_name || '',
    last_name: (session?.user as any)?.last_name || '',
    phone: (session?.user as any)?.phone || '',
    country: (session?.user as any)?.country || ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      // TODO: Implement API call to update profile
      await api.patch('/api/v1/users/me/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      })

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: (session?.user as any)?.first_name || '',
      last_name: (session?.user as any)?.last_name || '',
      phone: (session?.user as any)?.phone || '',
      country: (session?.user as any)?.country || ''
    })
    setIsEditing(false)
    setMessage(null)
  }

  return (
    <div className="relative z-10 space-y-8 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Manage your personal information and preferences
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Status Messages */}
          {message && (
            <div className={`mb-8 p-4 rounded-xl border backdrop-blur-sm ${
              message.type === 'success'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-red-50/80 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2">
            {/* Enhanced Profile Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50/50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">Profile Information</CardTitle>
                    <p className="text-sm text-gray-600">View and manage your personal information</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-900 font-medium">{(session?.user as any)?.email}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-8">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                    {isEditing ? (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="firstName"
                          value={formData.first_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                          className="pl-10 bg-white/50 border-gray-200 focus:border-purple-300 focus:ring-purple-100"
                          placeholder="Enter your first name"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                        <User className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-900 font-medium">{(session?.user as any)?.first_name || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                    {isEditing ? (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="lastName"
                          value={formData.last_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                          className="pl-10 bg-white/50 border-gray-200 focus:border-purple-300 focus:ring-purple-100"
                          placeholder="Enter your last name"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                        <User className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-900 font-medium">{(session?.user as any)?.last_name || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                    {isEditing ? (
                      <PhoneNumberInput
                        value={formData.phone}
                        onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                        placeholder="Enter your phone number"
                        className="bg-white/50 border-gray-200 focus:border-purple-300 focus:ring-purple-100"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                        <Phone className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-900 font-medium">{(session?.user as any)?.phone || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Account Type</Label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                      <Shield className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-900 font-medium capitalize">{(session?.user as any)?.role === 'customer' ? 'Customer' : (session?.user as any)?.role === 'merchant' ? 'Merchant' : 'Admin'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Verification Status</Label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                      {(session?.user as any)?.is_verified ? (
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 text-amber-700">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">Pending Verification</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/customer/kyc" className="text-amber-700 border-amber-300 hover:bg-amber-50">
                              Complete KYC
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Account Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50/50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">Account Actions</CardTitle>
                    <p className="text-sm text-gray-600">Manage your account settings and security</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="w-full border-gray-300 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <Button variant="outline" className="w-full justify-start hover:bg-gray-50 border-gray-200" asChild>
                    <Link href="/customer/settings?tab=security">
                      <Lock className="h-4 w-4 mr-2 text-gray-500" />
                      Change Password
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full justify-start hover:bg-gray-50 border-gray-200" asChild>
                    <Link href="/customer/settings?tab=security">
                      <Shield className="h-4 w-4 mr-2 text-gray-500" />
                      Security Settings
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full justify-start hover:bg-gray-50 border-gray-200" asChild>
                    <Link href="/customer/settings?tab=notifications">
                      <Bell className="h-4 w-4 mr-2 text-gray-500" />
                      Notification Preferences
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}
