import * as React from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

type LineChartProps = {
  data: any[]
  lines: {
    key: string
    name: string
    color: string
  }[]
  xAxisKey: string
  range?: '7d' | '30d' | '12m'
}

export function LineChartComponent({ data, lines, xAxisKey, range }: LineChartProps) {
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem)
    if (range === '12m') {
      return date.toLocaleDateString('default', { month: 'short' })
    } else {
      return date.toLocaleDateString('default', { day: 'numeric', month: 'short' })
    }
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={xAxisKey} 
          tickFormatter={formatXAxis}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        {lines.map(line => (
          <Line 
            key={line.key}
            type="monotone" 
            dataKey={line.key} 
            name={line.name}
            stroke={line.color}
            activeDot={{ r: 8 }} 
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
