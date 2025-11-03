'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function VerificationDashboard() {
  const { data: verificationData, isLoading } = useQuery({
    queryKey: ['verification-dashboard'],
    queryFn: () => axios.get('/api/payments/verification/dashboard/').then(res => res.data)
  })

  if (isLoading) {
    return <div>Loading verification data...</div>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Verification Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {verificationData?.providers?.map((provider: any) => (
              <div key={provider.name} className="flex justify-between items-center">
                <span className="text-sm">{provider.name}</span>
                <Badge variant={provider.healthy ? "default" : "destructive"}>
                  {provider.healthy ? "Healthy" : "Issues"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {verificationData?.alerts?.map((alert: any, index: number) => (
              <div key={index} className="text-sm">
                <Badge variant="outline" className="mr-2">
                  {alert.status}
                </Badge>
                {alert.message}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Verification activity by region
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
