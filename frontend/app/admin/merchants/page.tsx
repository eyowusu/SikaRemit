'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { UserPlus, Mail, Clock, CheckCircle, XCircle, Copy, Eye, Trash2, RefreshCw, FileText, Search, Filter, X, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'
import { merchantApi } from '@/lib/api/client-client'

interface MerchantInvitation {
  id: string
  email: string
  businessName: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  invitedAt: string
  expiresAt: string
  invitedBy: string
  invitationToken: string
  acceptedAt?: string
  businessType?: string
  phoneNumber?: string
  notes?: string
}

interface MerchantApplication {
  id: string
  businessName: string
  businessType: string
  businessDescription: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  website?: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  contactPhone: string
  contactPosition?: string
  industry: string
  employeeCount?: string
  monthlyRevenue?: string
  paymentMethods: string[]
  hearAboutUs?: string
  specialRequirements?: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
}

export default function MerchantInvitationsPage() {
  const [invitations, setInvitations] = useState<MerchantInvitation[]>([])
  const [applications, setApplications] = useState<MerchantApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const { toast } = useToast()

  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  // Bulk operations state
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([])
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Form state for new invitation
  const [inviteForm, setInviteForm] = useState({
    email: '',
    businessName: '',
    businessType: '',
    phoneNumber: '',
    notes: ''
  })

  // Load invitations
  useEffect(() => {
    loadInvitations()
  }, [searchTerm, statusFilter, dateRange, sortBy])

  const loadInvitations = async () => {
    try {
      // Load invitations and applications using the API client
      const [invitationsResponse, applicationsResponse] = await Promise.all([
        merchantApi.getInvitations(),
        merchantApi.getApplications()
      ])

      if (invitationsResponse.status >= 200 && invitationsResponse.status < 300) {
        let invitationsData = invitationsResponse.data?.results || invitationsResponse.data || []
        invitationsData = filterAndSortInvitations(invitationsData)
        setInvitations(invitationsData)
      }

      if (applicationsResponse.status >= 200 && applicationsResponse.status < 300) {
        let applicationsData = applicationsResponse.data?.results || applicationsResponse.data || []
        applicationsData = filterAndSortApplications(applicationsData)
        setApplications(applicationsData)
      }

      // If either request failed, show error but don't fail completely
      if (invitationsResponse.status >= 400 || applicationsResponse.status >= 400) {
        throw new Error('Failed to load some data')
      }
    } catch (error) {
      console.error('Failed to load merchant data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load merchant data. Please try again.',
        variant: 'destructive'
      })
      // Initialize with empty arrays on error
      setInvitations([])
      setApplications([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filtering and sorting functions
  const filterAndSortInvitations = (data: MerchantInvitation[]) => {
    let filtered = data.filter(inv => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!inv.email.toLowerCase().includes(searchLower) &&
            !inv.businessName.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== 'all' && inv.status !== statusFilter) {
        return false
      }

      // Date range filter
      if (dateRange !== 'all') {
        const invDate = new Date(inv.invitedAt)
        const now = new Date()
        const daysDiff = (now.getTime() - invDate.getTime()) / (1000 * 3600 * 24)

        switch (dateRange) {
          case 'today':
            if (daysDiff > 1) return false
            break
          case 'week':
            if (daysDiff > 7) return false
            break
          case 'month':
            if (daysDiff > 30) return false
            break
        }
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime()
        case 'oldest':
          return new Date(a.invitedAt).getTime() - new Date(b.invitedAt).getTime()
        case 'email':
          return a.email.localeCompare(b.email)
        case 'business':
          return a.businessName.localeCompare(b.businessName)
        default:
          return 0
      }
    })

    return filtered
  }

  const filterAndSortApplications = (data: MerchantApplication[]) => {
    let filtered = data.filter(app => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!app.businessName.toLowerCase().includes(searchLower) &&
            !app.contactEmail.toLowerCase().includes(searchLower) &&
            !app.contactFirstName.toLowerCase().includes(searchLower) &&
            !app.contactLastName.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false
      }

      // Date range filter
      if (dateRange !== 'all') {
        const appDate = new Date(app.submittedAt)
        const now = new Date()
        const daysDiff = (now.getTime() - appDate.getTime()) / (1000 * 3600 * 24)

        switch (dateRange) {
          case 'today':
            if (daysDiff > 1) return false
            break
          case 'week':
            if (daysDiff > 7) return false
            break
          case 'month':
            if (daysDiff > 30) return false
            break
        }
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        case 'oldest':
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
        case 'business':
          return a.businessName.localeCompare(b.businessName)
        default:
          return 0
      }
    })

    return filtered
  }

  // Bulk operations functions
  const handleSelectAllInvitations = (checked: boolean) => {
    if (checked) {
      setSelectedInvitations(invitations.map(inv => inv.id))
    } else {
      setSelectedInvitations([])
    }
  }

  const onSelectInvitation = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedInvitations(prev => [...prev, id])
    } else {
      setSelectedInvitations(prev => prev.filter(invId => invId !== id))
    }
  }

  const handleSelectAllApplications = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(applications.map(app => app.id))
    } else {
      setSelectedApplications([])
    }
  }

  const onSelectApplication = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplications(prev => [...prev, id])
    } else {
      setSelectedApplications(prev => prev.filter(appId => appId !== id))
    }
  }

  const handleBulkResendInvitations = async () => {
    if (selectedInvitations.length === 0) return

    try {
      const promises = selectedInvitations.map(id => merchantApi.resendInvitation(id))
      await Promise.all(promises)

      toast({
        title: 'Bulk Operation Completed',
        description: `Resent ${selectedInvitations.length} invitation(s)`,
      })

      setSelectedInvitations([])
      loadInvitations()
    } catch (error) {
      toast({
        title: 'Bulk Operation Failed',
        description: 'Some invitations could not be resent. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleBulkCancelInvitations = async () => {
    if (selectedInvitations.length === 0) return

    try {
      const promises = selectedInvitations.map(id => merchantApi.cancelInvitation(id))
      await Promise.all(promises)

      toast({
        title: 'Bulk Operation Completed',
        description: `Cancelled ${selectedInvitations.length} invitation(s)`,
      })

      setSelectedInvitations([])
      loadInvitations()
    } catch (error) {
      toast({
        title: 'Bulk Operation Failed',
        description: 'Some invitations could not be cancelled. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleBulkApproveApplications = async () => {
    if (selectedApplications.length === 0) return

    try {
      const promises = selectedApplications.map(id => merchantApi.approveApplication(id))
      await Promise.all(promises)

      toast({
        title: 'Bulk Operation Completed',
        description: `Approved ${selectedApplications.length} application(s)`,
      })

      setSelectedApplications([])
      loadInvitations()
    } catch (error) {
      toast({
        title: 'Bulk Operation Failed',
        description: 'Some applications could not be approved. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDateRange('all')
    setSortBy('newest')
  }

  const handleSendInvitation = async () => {
    if (!inviteForm.email || !inviteForm.businessName) {
      toast({
        title: 'Validation Error',
        description: 'Email and business name are required',
        variant: 'destructive'
      })
      return
    }

    try {
      // Create invitation via API client
      const response = await merchantApi.createInvitation({
        email: inviteForm.email,
        businessName: inviteForm.businessName,
        businessType: inviteForm.businessType,
        phoneNumber: inviteForm.phoneNumber,
        notes: inviteForm.notes
      })

      if (response.status >= 200 && response.status < 300) {
        const newInvitation = response.data
        setInvitations(prev => [newInvitation, ...prev])
        setInviteForm({ email: '', businessName: '', businessType: '', phoneNumber: '', notes: '' })
        setShowInviteDialog(false)

        toast({
          title: 'Invitation Sent',
          description: `Invitation sent to ${inviteForm.email}`,
        })
      } else {
        throw new Error(response.data?.detail || response.data?.error || 'Failed to send invitation')
      }
    } catch (error: any) {
      console.error('Failed to send invitation:', error)
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const onCancel = async (invitationId: string) => {
    try {
      // Cancel invitation via API client
      const response = await merchantApi.cancelInvitation(invitationId)

      if (response.status >= 200 && response.status < 300) {
        // Update local state
        setInvitations(prev =>
          prev.map(inv =>
            inv.id === invitationId
              ? { ...inv, status: 'cancelled' as const }
              : inv
          )
        )

        toast({
          title: 'Invitation Cancelled',
          description: 'The invitation has been cancelled',
        })
      } else {
        throw new Error(response.data?.detail || response.data?.error || 'Failed to cancel invitation')
      }
    } catch (error: any) {
      console.error('Failed to cancel invitation:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const onResend = async (invitation: MerchantInvitation) => {
    try {
      // Resend invitation via API client
      const response = await merchantApi.resendInvitation(invitation.id)

      if (response.status >= 200 && response.status < 300) {
        toast({
          title: 'Invitation Resent',
          description: `Invitation resent to ${invitation.email}`,
        })
      } else {
        throw new Error(response.data?.detail || response.data?.error || 'Failed to resend invitation')
      }
    } catch (error: any) {
      console.error('Failed to resend invitation:', error)
      toast({
        title: 'Error',
        description: 'Failed to resend invitation. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const onApprove = async (applicationId: string) => {
    try {
      // Approve application via API client
      const response = await merchantApi.approveApplication(applicationId)

      if (response.status >= 200 && response.status < 300) {
        const result = response.data

        // Update local state
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, status: 'approved' as const }
              : app
          )
        )

        // Add the created invitation to the invitations list
        if (result.invitation_token) {
          // Reload invitations to get the new one
          loadInvitations()
        }

        toast({
          title: 'Application Approved',
          description: 'Merchant invitation has been sent',
        })
      } else {
        throw new Error(response.data?.detail || response.data?.error || 'Failed to approve application')
      }
    } catch (error: any) {
      console.error('Failed to approve application:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve application. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const onReject = async (applicationId: string, reason: string) => {
    try {
      // Reject application via API client
      const response = await merchantApi.rejectApplication(applicationId, reason)

      if (response.status >= 200 && response.status < 300) {
        // Update local state
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, status: 'rejected' as const }
              : app
          )
        )

        toast({
          title: 'Application Rejected',
          description: 'Merchant has been notified of rejection',
        })
      } else {
        throw new Error(response.data?.detail || response.data?.error || 'Failed to reject application')
      }
    } catch (error: any) {
      console.error('Failed to reject application:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject application. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const copyInvitationLink = (token: string) => {
    const invitationUrl = `${window.location.origin}/auth/merchant/invite/${token}`
    navigator.clipboard.writeText(invitationUrl)
    toast({
      title: 'Link Copied',
      description: 'Invitation link copied to clipboard',
    })
  }

  const getStatusBadge = (status: MerchantInvitation['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'accepted':
        return <Badge variant="secondary" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
      case 'expired':
        return <Badge variant="secondary" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="text-gray-600"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
    }
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted')
  const expiredInvitations = invitations.filter(inv => inv.status === 'expired' || inv.status === 'cancelled')

  const showCheckboxes = selectedInvitations.length > 0 || selectedApplications.length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading merchant invitations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-purple-600" />
            Merchant Invitations
          </h1>
          <p className="text-slate-600 mt-1 text-base">
            Invite and manage merchant accounts
          </p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 px-6 py-3">
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Merchant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New Merchant</DialogTitle>
              <DialogDescription>
                Send an invitation to a business to join sikaremit as a merchant.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="merchant@example.com"
                />
              </div>
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={inviteForm.businessName}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="ABC Company Ltd"
                />
              </div>
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={inviteForm.businessType} onValueChange={(value) => setInviteForm(prev => ({ ...prev, businessType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant/Food Service</SelectItem>
                    <SelectItem value="retail">Retail/Shop</SelectItem>
                    <SelectItem value="services">Professional Services</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={inviteForm.phoneNumber}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={inviteForm.notes}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional information about the merchant..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendInvitation}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search by business name, email, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/50 backdrop-blur-sm border-white/30 focus:border-purple-300"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Filter className="w-5 h-5 text-slate-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-white/50 backdrop-blur-sm border-white/30">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32 bg-white/50 backdrop-blur-sm border-white/30">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-white/50 backdrop-blur-sm border-white/30">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="email">Email A-Z</SelectItem>
                  <SelectItem value="business">Business A-Z</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || statusFilter !== 'all' || dateRange !== 'all' || sortBy !== 'newest') && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="hover:bg-white/50">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {(selectedInvitations.length > 0 || selectedApplications.length > 0) && (
            <div className="mt-4 p-4 bg-purple-50/50 backdrop-blur-sm border border-purple-200/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-800">
                  {selectedInvitations.length > 0 && `${selectedInvitations.length} invitation${selectedInvitations.length > 1 ? 's' : ''} selected`}
                  {selectedInvitations.length > 0 && selectedApplications.length > 0 && ', '}
                  {selectedApplications.length > 0 && `${selectedApplications.length} application${selectedApplications.length > 1 ? 's' : ''} selected`}
                </span>
                <div className="flex gap-2">
                  {selectedInvitations.length > 0 && (
                    <>
                      <Button size="sm" variant="outline" onClick={handleBulkResendInvitations} className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70">
                        <Mail className="w-4 h-4 mr-1" />
                        Resend Selected
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleBulkCancelInvitations} className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70">
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel Selected
                      </Button>
                    </>
                  )}
                  {selectedApplications.length > 0 && (
                    <Button size="sm" variant="outline" onClick={handleBulkApproveApplications} className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve Selected
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedInvitations([])
                      setSelectedApplications([])
                    }}
                    className="hover:bg-white/50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Total Invitations</CardTitle>
            <Mail className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{invitations.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Pending Invites</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{pendingInvitations.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Accepted</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{acceptedInvitations.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Applications</CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{applications.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Conversion Rate</CardTitle>
            <UserPlus className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {invitations.length > 0 ? Math.round((acceptedInvitations.length / invitations.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Table */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Invitations</CardTitle>
          <CardDescription className="text-slate-600">Manage merchant invitations and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All ({invitations.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingInvitations.length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({acceptedInvitations.length})</TabsTrigger>
              <TabsTrigger value="expired">Expired/Cancelled ({expiredInvitations.length})</TabsTrigger>
              <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showCheckboxes && <TableHead className="w-12"></TableHead>}
                    <TableHead>Business</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      {showCheckboxes && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedInvitations.includes(invitation.id)}
                            onChange={(e) => onSelectInvitation(invitation.id, e.target.checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{invitation.businessName}</TableCell>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>{new Date(invitation.invitedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => copyInvitationLink(invitation.invitationToken)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          {invitation.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => onResend(invitation)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => onCancel(invitation.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showCheckboxes && <TableHead className="w-12"></TableHead>}
                    <TableHead>Business</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      {showCheckboxes && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedInvitations.includes(invitation.id)}
                            onChange={(e) => onSelectInvitation(invitation.id, e.target.checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{invitation.businessName}</TableCell>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>{new Date(invitation.invitedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => copyInvitationLink(invitation.invitationToken)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          {invitation.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => onResend(invitation)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => onCancel(invitation.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="accepted" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Accepted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acceptedInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.businessName}</TableCell>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>{new Date(invitation.invitedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{invitation.acceptedAt ? new Date(invitation.acceptedAt).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => copyInvitationLink(invitation.invitationToken)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="expired" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expired</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.businessName}</TableCell>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>{new Date(invitation.invitedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => copyInvitationLink(invitation.invitationToken)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="applications" className="mt-4">
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {showCheckboxes && <TableHead className="w-12"></TableHead>}
                      <TableHead>Business</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        {showCheckboxes && (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedApplications.includes(application.id)}
                              onChange={(e) => onSelectApplication(application.id, e.target.checked)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{application.businessName}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{application.contactFirstName} {application.contactLastName}</div>
                            <div className="text-muted-foreground">{application.contactEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{application.industry}</TableCell>
                        <TableCell>
                          {application.status === 'pending' && <Badge variant="secondary" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>}
                          {application.status === 'approved' && <Badge variant="secondary" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>}
                          {application.status === 'rejected' && <Badge variant="secondary" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>}
                        </TableCell>
                        <TableCell>{new Date(application.submittedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {application.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onApprove(application.id)}
                                  title="Approve application"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onReject(application.id, 'Rejected')}
                                  title="Reject application"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="View application details">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Application Details: {application.businessName}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div><strong>Business:</strong> {application.businessName}</div>
                                  <div><strong>Contact:</strong> {application.contactFirstName} {application.contactLastName}</div>
                                  <div><strong>Email:</strong> {application.contactEmail}</div>
                                  <div><strong>Description:</strong> {application.businessDescription}</div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusBadge(status: MerchantInvitation['status']) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'accepted':
      return <Badge variant="secondary" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
    case 'expired':
      return <Badge variant="secondary" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
    case 'cancelled':
      return <Badge variant="secondary" className="text-gray-600"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
  }
}
