import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { DashboardStats } from '@/components/admin/dashboard-stats'
import { UsersTable } from '@/components/admin/users-table'
import { VerificationApproval } from '@/components/admin/verification-approval'
import { VerificationDashboard } from '@/components/admin/verification-dashboard'

export const metadata: Metadata = {
  title: 'Dashboard | PayGlobe',
}

export default function DashboardPage() {
  // TODO: Replace with actual auth check once implemented
  const isAuthenticated = true // Temporarily set to true for development
  const userRole = 'admin' // This should come from auth context
  
  if (!isAuthenticated) {
    redirect('/auth')
  }
  
  // Only show admin dashboard for admin users
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your platform's performance and manage users</p>
        </div>
        
        <DashboardStats />
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Analytics</h2>
          <VerificationDashboard />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <UsersTable />
          <VerificationApproval />
        </div>
      </div>
    </div>
  )
}
