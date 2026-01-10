'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api/axios'

export default function SalesChart() {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['merchant-sales-trend'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/merchants/dashboard/sales_trend/')
        return response.data
      } catch (error) {
        // Mock data for demo
        return [
          { date: '2024-10-24', total: 1200, count: 12 },
          { date: '2024-10-25', total: 1400, count: 14 },
          { date: '2024-10-26', total: 1100, count: 11 },
          { date: '2024-10-27', total: 1600, count: 16 },
          { date: '2024-10-28', total: 1800, count: 18 },
          { date: '2024-10-29', total: 1500, count: 15 },
          { date: '2024-10-30', total: 2000, count: 20 },
          { date: '2024-10-31', total: 2200, count: 22 },
          { date: '2024-11-01', total: 1900, count: 19 },
          { date: '2024-11-02', total: 2100, count: 21 },
          { date: '2024-11-03', total: 1800, count: 18 },
          { date: '2024-11-04', total: 2300, count: 23 },
          { date: '2024-11-05', total: 2500, count: 25 },
          { date: '2024-11-06', total: 2000, count: 20 },
          { date: '2024-11-07', total: 2400, count: 24 },
        ]
      }
    }
  })

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const formattedData = salesData?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: item.total || item.sales || 0,
    transactions: item.count || item.transactions || 0
  })) || []

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            className="text-gray-600 dark:text-gray-400 text-xs"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            className="text-gray-600 dark:text-gray-400 text-xs"
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: any, name: string) => [
              name === 'sales' ? `$${value}` : value,
              name === 'sales' ? 'Revenue' : 'Transactions'
            ]}
            labelStyle={{ color: '#374151' }}
          />
          <Bar
            dataKey="sales"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="sales"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
