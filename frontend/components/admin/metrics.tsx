import * as React from 'react'
import { useState } from 'react'
import { getAdminMetrics } from '@/lib/api/dashboard'
import { LineChartComponent } from '@/components/ui/line-chart'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'

export function AdminMetrics() {
  const [range, setRange] = useState<'7d' | '30d' | '12m'>('7d')
  const [metrics, setMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  React.useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true)
      try {
        const data = await getAdminMetrics()
        // For now, create mock time-series data from admin metrics
        // TODO: Implement proper dashboard metrics endpoint
        const mockData = [
          { period: 'Day 1', user_count: data.totalUsers, revenue_sum: data.revenueToday },
          { period: 'Day 2', user_count: data.totalUsers + 5, revenue_sum: data.revenueToday + 100 },
          { period: 'Day 3', user_count: data.totalUsers + 10, revenue_sum: data.revenueToday + 200 },
        ]
        setMetrics(mockData)
      } catch (error) {
        console.error('Failed to load metrics', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadMetrics()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Metrics</h2>
        <Select value={range} onValueChange={(value: '7d' | '30d' | '12m') => setRange(value)}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="12m">12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <LineChartComponent 
                data={metrics} 
                xAxisKey="period"
                lines={[
                  { key: 'user_count', name: 'Users', color: '#8884d8' }
                ]} 
              />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <LineChartComponent 
                data={metrics} 
                xAxisKey="period"
                lines={[
                  { key: 'revenue_sum', name: 'Revenue', color: '#82ca9d' }
                ]} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
