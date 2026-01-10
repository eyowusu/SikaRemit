'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollText } from 'lucide-react'

type AuditLogItem = {
  id: number | string
  action: string
  user_email?: string
  admin_email?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export default function AdminAuditLogsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async (): Promise<AuditLogItem[]> => {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/audit-logs/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      return response.json()
    },
    retry: false,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="w-full space-y-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ScrollText className="h-8 w-8" />
          Audit Logs
        </h1>
        <Card data-testid="audit-logs-table">
          <CardHeader><CardTitle>System Audit Logs</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading audit logs...</p>
            ) : error ? (
              <div className="space-y-3">
                <p className="text-muted-foreground">Failed to load audit logs.</p>
                <button
                  type="button"
                  className="text-sm font-medium text-purple-700 hover:underline"
                  onClick={() => refetch()}
                >
                  Try again
                </button>
              </div>
            ) : !logs || logs.length === 0 ? (
              <p className="text-muted-foreground">No audit logs</p>
            ) : (
              <div className="space-y-4">
                <div className="md:hidden space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 bg-white/50 dark:bg-gray-900/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{log.action}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {log.user_email || 'Unknown user'}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {formatDate(log.timestamp)}
                        </Badge>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <pre className="mt-3 text-xs overflow-x-auto whitespace-pre-wrap break-words bg-muted/30 rounded-md p-3">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Metadata</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.action}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.user_email || 'Unknown'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(log.timestamp)}</TableCell>
                          <TableCell className="max-w-[520px]">
                            {log.metadata && Object.keys(log.metadata).length > 0 ? (
                              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words bg-muted/30 rounded-md p-3">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
