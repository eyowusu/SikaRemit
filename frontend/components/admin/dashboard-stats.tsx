'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminMetrics, AdminMetrics } from '@/lib/api/dashboard'
import { useQuery } from '@tanstack/react-query'

export function DashboardStats() {
  const { data, isLoading } = useQuery<AdminMetrics>({
    queryKey: ['admin-metrics'],
    queryFn: getAdminMetrics
  })

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? 'Loading...' : data?.totalUsers}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? 'Loading...' : data?.activeMerchants}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Today's Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? 'Loading...' : `$${data?.revenueToday}`}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? 'Loading...' : data?.pendingVerifications}
        </CardContent>
      </Card>
    </div>
  )
}
