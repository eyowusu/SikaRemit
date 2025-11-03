'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getProfile, updateProfile, uploadAvatar } from '@/lib/api/accounts'
import { User } from '@/lib/types/auth'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Timeline } from '@/components/ui/timeline'
import { getUserActivity, TimelineEvent } from '@/lib/api/activity'

export default function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activity, setActivity] = useState<TimelineEvent[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile()
        setProfile(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const data = await getUserActivity(profile?.id || '')
        setActivity(data)
      } catch (error) {
        console.error('Failed to load activity', error)
      }
    }
    if (profile) {
      loadActivity()
    }
  }, [profile])

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return
    
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const updatedProfile = await uploadAvatar(formData)
      setProfile(updatedProfile)
      toast({
        title: 'Success',
        description: 'Profile picture updated',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      })
    }
  }

  const handleResendVerification = async () => {
    try {
      // Add resend verification API call here when backend supports it
      // await resendVerificationEmail()
      toast({
        title: 'Verification email sent',
        description: 'Please check your email for the verification link.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send verification email',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!profile) return

    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    try {
      const updatedProfile = await updateProfile({
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
      })

      setProfile(updatedProfile)
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      })
      return
    }

    try {
      // Add password change API call here when backend supports it
      // await changePassword({ currentPassword, newPassword })
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (!profile) return <div>Profile not found</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="flex items-center space-x-2">
          {profile?.isVerified ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              Verified
            </Badge>
          ) : (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Clock className="w-4 h-4 mr-1" />
                Unverified
              </Badge>
              <Button variant="outline" size="sm" onClick={handleResendVerification}>
                Resend Verification
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} />
            ) : (
              <AvatarFallback>
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <Label htmlFor="avatar">Upload new photo</Label>
            <Input 
              id="avatar" 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleAvatarUpload(e.target.files[0])
                }
              }}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                defaultValue={profile.firstName} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                defaultValue={profile.lastName} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                defaultValue={profile.email} 
                required 
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
              />
            </div>
            <Button type="submit">
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={activity} />
        </CardContent>
      </Card>
    </div>
  )
}
