'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar } from 'lucide-react'

interface CronEditorProps {
  value: string
  onChange: (value: string) => void
}

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at noon', value: '0 12 * * *' },
  { label: 'Every Monday at 9am', value: '0 9 * * 1' },
  { label: 'First day of month', value: '0 0 1 * *' },
  { label: 'Every weekday at 9am', value: '0 9 * * 1-5' },
]

const DAYS_OF_WEEK = [
  { label: 'Sunday', value: '0' },
  { label: 'Monday', value: '1' },
  { label: 'Tuesday', value: '2' },
  { label: 'Wednesday', value: '3' },
  { label: 'Thursday', value: '4' },
  { label: 'Friday', value: '5' },
  { label: 'Saturday', value: '6' },
]

export function CronEditor({ value, onChange }: CronEditorProps) {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple')
  const [cronParts, setCronParts] = useState({
    minute: '*',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*'
  })
  const [nextExecutions, setNextExecutions] = useState<string[]>([])

  useEffect(() => {
    if (value) {
      const parts = value.split(' ')
      if (parts.length === 5) {
        setCronParts({
          minute: parts[0],
          hour: parts[1],
          dayOfMonth: parts[2],
          month: parts[3],
          dayOfWeek: parts[4]
        })
      }
    }
  }, [value])

  useEffect(() => {
    const cron = `${cronParts.minute} ${cronParts.hour} ${cronParts.dayOfMonth} ${cronParts.month} ${cronParts.dayOfWeek}`
    onChange(cron)
    calculateNextExecutions(cron)
  }, [cronParts])

  const calculateNextExecutions = (cron: string) => {
    // Simplified calculation - in production, use a proper cron parser library
    const executions: string[] = []
    const now = new Date()
    
    // Mock next 5 executions
    for (let i = 1; i <= 5; i++) {
      const next = new Date(now.getTime() + i * 60 * 60 * 1000) // Mock: every hour
      executions.push(next.toLocaleString())
    }
    
    setNextExecutions(executions)
  }

  const handlePresetChange = (preset: string) => {
    onChange(preset)
    const parts = preset.split(' ')
    if (parts.length === 5) {
      setCronParts({
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4]
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Badge
          variant={mode === 'simple' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setMode('simple')}
        >
          Simple
        </Badge>
        <Badge
          variant={mode === 'advanced' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setMode('advanced')}
        >
          Advanced
        </Badge>
      </div>

      {mode === 'simple' ? (
        /* Simple Mode - Presets */
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <Select value={value} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        /* Advanced Mode - Manual Entry */
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Minute</Label>
              <Input
                placeholder="*"
                value={cronParts.minute}
                onChange={(e) => setCronParts({ ...cronParts, minute: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">0-59</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Hour</Label>
              <Input
                placeholder="*"
                value={cronParts.hour}
                onChange={(e) => setCronParts({ ...cronParts, hour: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">0-23</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Day</Label>
              <Input
                placeholder="*"
                value={cronParts.dayOfMonth}
                onChange={(e) => setCronParts({ ...cronParts, dayOfMonth: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">1-31</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Month</Label>
              <Input
                placeholder="*"
                value={cronParts.month}
                onChange={(e) => setCronParts({ ...cronParts, month: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">1-12</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Day of Week</Label>
              <Input
                placeholder="*"
                value={cronParts.dayOfWeek}
                onChange={(e) => setCronParts({ ...cronParts, dayOfWeek: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">0-6</p>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-mono">{value}</p>
          </div>
        </div>
      )}

      {/* Current Expression */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cron Expression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-md font-mono text-sm">
            {value || '* * * * *'}
          </div>
        </CardContent>
      </Card>

      {/* Next Executions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Next 5 Executions
          </CardTitle>
          <CardDescription>Estimated execution times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nextExecutions.map((execution, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{index + 1}</Badge>
                <span>{execution}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Cron Format:</strong> minute hour day month day-of-week
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Use * for "any", numbers for specific values, or ranges like 1-5
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
