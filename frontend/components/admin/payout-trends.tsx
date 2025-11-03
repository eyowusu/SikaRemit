import * as React from 'react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChartComponent } from '@/components/ui/line-chart'
import { getAdminMetrics } from '@/lib/api/dashboard'

export function PayoutTrends() {
  const [range, setRange] = React.useState<'7d'|'30d'|'12m'>('7d')
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const metrics = await getAdminMetrics()
        // Create mock trend data from admin metrics
        // TODO: Implement proper payout trends endpoint
        const mockTrends = [
          { date: 'Day 1', amount: metrics.revenueToday, count: 10 },
          { date: 'Day 2', amount: metrics.revenueToday + 50, count: 15 },
          { date: 'Day 3', amount: metrics.revenueToday + 100, count: 20 },
          { date: 'Day 4', amount: metrics.revenueToday + 150, count: 25 },
          { date: 'Day 5', amount: metrics.revenueToday + 200, count: 18 },
        ]
        setData(mockTrends)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [range])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payout Volume Trends</CardTitle>
        <Select value={range} onValueChange={(value: any) => setRange(value)}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="12m">12 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <LineChartComponent 
            data={data} 
            xAxisKey="date"
            lines={[
              { key: 'amount', name: 'Amount', color: '#8884d8' },
              { key: 'count', name: 'Count', color: '#82ca9d' }
            ]} 
          />
        )}
      </CardContent>
    </Card>
  )
}
