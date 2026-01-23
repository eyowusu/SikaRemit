'use client'

import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api/axios'

export default function RevenueChart() {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['merchant-revenue-trend'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/merchants/dashboard/sales_trend/')
        return response.data
      } catch (error) {
        // Mock data for demo
        return [
          { date: '2024-11-01', total: 1200 },
          { date: '2024-11-02', total: 1400 },
          { date: '2024-11-03', total: 1100 },
          { date: '2024-11-04', total: 1600 },
          { date: '2024-11-05', total: 1800 },
          { date: '2024-11-06', total: 1500 },
          { date: '2024-11-07', total: 2000 },
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

  const formattedData = revenueData?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.total || item.revenue || 0
  })) || []

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
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
            formatter={(value: any) => [`$${value}`, 'Revenue']}
            labelStyle={{ color: '#374151' }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
