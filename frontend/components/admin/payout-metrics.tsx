'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminMetrics, getPayoutMetrics, getSmsMetrics } from '@/lib/api/dashboard'
import { usePayoutWebhooks } from '@/hooks/useWebhooks'
import { WebhookEvent } from '@/lib/types/payout'
import { SmsMetrics } from '@/lib/types/notifications'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

type PayoutMetricsData = {
  pending: number
  processed: number
  volume: number
  currency: string
}

export function PayoutMetrics() {
  const [smsMetrics, setSmsMetrics] = React.useState<SmsMetrics | null>(null)
  const [smsLoading, setSmsLoading] = React.useState(false)
  const [realtime, setRealtime] = React.useState(false)

  usePayoutWebhooks((event) => {
    if (!event) return
    
    if (event.event_type === 'payout_processed') {
      refetch()
    }
  })

  const { data, isLoading, refetch } = useQuery<PayoutMetricsData>({
    queryKey: ['payout-metrics'],
    queryFn: () => getPayoutMetrics()
  })

  const loadSmsMetrics = async () => {
    setSmsLoading(true)
    try {
      const data = await getSmsMetrics()
      setSmsMetrics(data)
    } finally {
      setSmsLoading(false)
    }
  }

  React.useEffect(() => {
    if (realtime) {
      const interval = setInterval(refetch, 30000)
      return () => clearInterval(interval)
    }
  }, [realtime, refetch])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
            </CardHeader>
            <CardContent>
              {data.pending}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Processed</CardTitle>
            </CardHeader>
            <CardContent>
              {data.processed}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Volume</CardTitle>
            </CardHeader>
            <CardContent>
              {data.volume} {data.currency}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex justify-center p-8">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>SMS Notifications</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              refetch()
              loadSmsMetrics()
            }}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {smsLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{smsMetrics?.sent || 0}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Real-time Updates</CardTitle>
          <Switch 
            checked={realtime}
            onCheckedChange={setRealtime}
            disabled={isLoading}
          />
        </CardHeader>
      </Card>
    </div>
  )
}
