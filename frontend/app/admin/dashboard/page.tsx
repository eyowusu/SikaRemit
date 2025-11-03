'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { UsersTable } from '@/components/admin/users-table'
import { VerificationApproval } from '@/components/admin/verification-approval'
import { DataTable } from '@/components/ui/data-table'
import { ExportDialog } from '@/components/ui/export-dialog'
import { exportUsers, exportVerifications } from '@/lib/api/admin'
import { downloadBlob } from '@/lib/utils/export'
import { NotificationBell } from '@/components/ui/notification-bell'
import { Button } from '@/components/ui/button'
import { AdminMetrics } from '@/components/admin/metrics'
import { PayoutMetrics } from '@/components/admin/payout-metrics'
import { PayoutTrends } from '@/components/admin/payout-trends'
import useSWR from 'swr'
import axios from 'axios'

interface DashboardAuditLog {
  id: string
  action: string
  user_email?: string
  admin_email?: string
  timestamp: string
  metadata: any
}

type AdminMetrics = {
  totalUsers: number
  activeUsers: number
  transactionsToday: number
  revenueToday: number
  pendingVerifications: number
}

const fetcher = (url: string) => axios.get(url).then(res => res.data)

export default function AdminDashboardPage() {
  const { data: metrics, error: metricsError } = useSWR('/api/admin/metrics/', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false
  })
  
  const { 
    data: auditLogs, 
    error: logsError,
    isLoading: logsLoading
  } = useSWR('/api/core/audit-logs/', fetcher, {
    refreshInterval: 60000
  })

  const { toast } = useToast()

  useEffect(() => {
    if (metricsError || logsError) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      })
    }
  }, [metricsError, logsError])

  const processedLogs = auditLogs?.map((log: DashboardAuditLog) => ({
    ...log,
    user_email: log.user_email || 'N/A',
    admin_email: log.admin_email || 'System'
  })) || []

  const auditColumns = [
    {
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ row }: { row: { original: DashboardAuditLog } }) => 
        new Date(row.original.timestamp).toLocaleString()
    },
    {
      accessorKey: 'action',
      header: 'Action',
    },
    {
      accessorKey: 'user_email',
      header: 'User',
    },
    {
      accessorKey: 'admin_email',
      header: 'Admin',
    },
  ]

  if (!metrics || !auditLogs) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-4 mb-6">
        <div className="flex items-center gap-4">
          <NotificationBell />
          <ExportDialog onExport={async (filters) => {
            const blob = await exportUsers('csv', filters)
            downloadBlob(blob, `users-filtered-${new Date().toISOString().split('T')[0]}.csv`)
          }}>
            <Button variant="outline">Export Users</Button>
          </ExportDialog>
          <ExportDialog onExport={async (filters) => {
            const blob = await exportVerifications('csv', filters)
            downloadBlob(blob, `verifications-filtered-${new Date().toISOString().split('T')[0]}.csv`)
          }}>
            <Button variant="outline">Export Verifications</Button>
          </ExportDialog>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today's Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.transactionsToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.pendingVerifications}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Verification Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <VerificationApproval />
          </CardContent>
        </Card>
      </div>

      <Card 
        className="mt-6"
        data-testid="metrics-card"
      >
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMetrics />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payout Metrics</h3>
        <PayoutMetrics />
        <PayoutTrends />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={auditColumns} data={processedLogs} />
        </CardContent>
      </Card>
    </div>
  )
}
