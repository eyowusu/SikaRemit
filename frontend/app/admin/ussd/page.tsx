'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Smartphone,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  BarChart3,
  Settings2
} from 'lucide-react'
import USSDMenuManager from '@/components/admin/ussd-menu-manager'
import {
  getUSSDTransactions,
  getUSSDSessions,
  getUSSDStats,
  simulateUSSD,
  resetUSSDSimulation,
  type USSDTransaction,
  type USSDSession
} from '@/lib/api/ussd'
import { useToast } from '@/hooks/use-toast'

export default function USSDMonitorPage() {
  const { toast } = useToast()
  const [simulatorData, setSimulatorData] = useState({
    phone_number: '',
    service_code: '*123#',
    text: ''
  })
  const [simulatorResponse, setSimulatorResponse] = useState('')
  const [simulatorLoading, setSimulatorLoading] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [currentMenu, setCurrentMenu] = useState('main')

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['ussd-transactions'],
    queryFn: () => getUSSDTransactions(),
    refetchInterval: 10000 // Refresh every 10 seconds
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['ussd-sessions'],
    queryFn: getUSSDSessions,
    refetchInterval: 5000 // Refresh every 5 seconds
  })

  const { data: stats } = useQuery({
    queryKey: ['ussd-stats'],
    queryFn: getUSSDStats
  })

  const handleSimulate = async () => {
    if (!simulatorData.phone_number || !simulatorData.service_code) {
      toast({
        title: 'Error',
        description: 'Please enter phone number and service code',
        variant: 'destructive'
      })
      return
    }

    setSimulatorLoading(true)
    try {
      const result = await simulateUSSD(simulatorData)
      setSimulatorResponse(result.response)
      setSessionActive(result.session_active)
      setCurrentMenu(result.current_menu || 'main')
      // Clear input after successful request
      setSimulatorData({ ...simulatorData, text: '' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to simulate USSD',
        variant: 'destructive'
      })
    } finally {
      setSimulatorLoading(false)
    }
  }

  const handleResetSession = async () => {
    if (!simulatorData.phone_number) {
      toast({
        title: 'Error',
        description: 'Please enter phone number first',
        variant: 'destructive'
      })
      return
    }

    try {
      await resetUSSDSimulation({
        phone_number: simulatorData.phone_number,
        service_code: simulatorData.service_code
      })
      setSimulatorResponse('')
      setSessionActive(false)
      setCurrentMenu('main')
      setSimulatorData({ ...simulatorData, text: '' })
      toast({ title: 'Success', description: 'Session reset successfully' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reset session',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; color: string }> = {
      active: { variant: 'default', icon: Activity, color: 'text-blue-600' },
      completed: { variant: 'default', icon: CheckCircle2, color: 'text-green-600' },
      timeout: { variant: 'secondary', icon: Clock, color: 'text-orange-600' },
      cancelled: { variant: 'destructive', icon: XCircle, color: 'text-red-600' }
    }
    const config = variants[status] || variants.active
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    )
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Smartphone className="h-8 w-8" />
            USSD Transaction Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and test USSD sessions in real-time
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_sessions}</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.active_sessions}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {stats.completed_sessions}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Timeout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.timeout_sessions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(stats.average_duration)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="simulator">Simulator</TabsTrigger>
            <TabsTrigger value="menus">Menu Config</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            {transaction.phone_number}
                          </CardTitle>
                          <CardDescription>
                            Session: {transaction.session_id}
                          </CardDescription>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Service Code</p>
                          <p className="font-semibold">{transaction.service_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Menu</p>
                          <p className="font-semibold">{transaction.current_menu}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Created</p>
                          <p className="font-semibold">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Updated</p>
                          <p className="font-semibold">
                            {new Date(transaction.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {transaction.text && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">User Input</p>
                          <div className="bg-muted p-3 rounded-md font-mono text-sm">
                            {transaction.text || '(empty)'}
                          </div>
                        </div>
                      )}

                      {transaction.menu_data && Object.keys(transaction.menu_data).length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Menu Data</p>
                          <div className="bg-muted p-3 rounded-md">
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(transaction.menu_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No USSD transactions</p>
                  <p className="text-muted-foreground mt-1">
                    USSD transactions will appear here when users interact with the service
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Active Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card key={session.session_id} className="border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            {session.phone_number}
                          </CardTitle>
                          <CardDescription>ID: {session.session_id}</CardDescription>
                        </div>
                        <Badge className="bg-blue-600">
                          <Activity className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Menu</p>
                          <p className="font-semibold">{session.current_menu}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Started</p>
                          <p className="font-semibold">
                            {new Date(session.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Activity</p>
                          <p className="font-semibold">
                            {new Date(session.last_activity).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {session.menu_history && session.menu_history.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Menu History</p>
                          <div className="flex flex-wrap gap-2">
                            {session.menu_history.map((menu, index) => (
                              <Badge key={index} variant="outline">
                                {index + 1}. {menu}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.data && Object.keys(session.data).length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Session Data</p>
                          <div className="bg-muted p-3 rounded-md">
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(session.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No active sessions</p>
                  <p className="text-muted-foreground mt-1">
                    Active USSD sessions will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Simulator Tab */}
          <TabsContent value="simulator">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      USSD Simulator
                    </CardTitle>
                    <CardDescription>
                      Test USSD interactions using your configured menus
                    </CardDescription>
                  </div>
                  {sessionActive && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      <Activity className="h-3 w-3 mr-1" />
                      Session Active • Menu: {currentMenu}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+233123456789"
                      value={simulatorData.phone_number}
                      onChange={(e) =>
                        setSimulatorData({ ...simulatorData, phone_number: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service">Service Code</Label>
                    <Input
                      id="service"
                      placeholder="*123#"
                      value={simulatorData.service_code}
                      onChange={(e) =>
                        setSimulatorData({ ...simulatorData, service_code: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text">User Input {sessionActive ? '(Enter your selection)' : '(Leave empty to start)'}</Label>
                  <Input
                    id="text"
                    placeholder={sessionActive ? "Enter 1, 2, 3..." : "Leave empty to see main menu"}
                    value={simulatorData.text}
                    onChange={(e) =>
                      setSimulatorData({ ...simulatorData, text: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSimulate()
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSimulate}
                    disabled={simulatorLoading}
                    className="flex-1"
                  >
                    {simulatorLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        {sessionActive ? 'Send Input' : 'Start Session'}
                      </>
                    )}
                  </Button>
                  {sessionActive && (
                    <Button
                      variant="outline"
                      onClick={handleResetSession}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reset Session
                    </Button>
                  )}
                </div>

                {simulatorResponse && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Response</Label>
                      {!sessionActive && simulatorResponse && (
                        <Badge variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Session Ended
                        </Badge>
                      )}
                    </div>
                    <div className="bg-muted p-4 rounded-md border-2 border-dashed">
                      <pre className="whitespace-pre-wrap font-mono text-sm">
                        {simulatorResponse}
                      </pre>
                    </div>
                  </div>
                )}

                {!simulatorResponse && (
                  <div className="bg-muted/50 p-4 rounded-md text-center text-muted-foreground">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Enter a phone number and click "Start Session" to begin</p>
                    <p className="text-xs mt-1">Menus are loaded from your Menu Config settings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Menus */}
            {stats && stats.popular_menus && stats.popular_menus.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Popular Menus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.popular_menus.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">{item.menu}</span>
                        <Badge variant="secondary">{item.count} visits</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Menu Configuration Tab */}
          <TabsContent value="menus">
            <USSDMenuManager />
          </TabsContent>
        </Tabs>
    </div>
  )
}
