'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield
} from 'lucide-react'
import {
  getSessions,
  logoutSession,
  logoutOtherSessions,
  getSessionAnalytics,
  type Session
} from '@/lib/api/sessions'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function SessionsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [sessionToLogout, setSessionToLogout] = useState<string | null>(null)
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false)

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const { data: analytics } = useQuery({
    queryKey: ['session-analytics'],
    queryFn: getSessionAnalytics
  })

  const logoutMutation = useMutation({
    mutationFn: logoutSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session-analytics'] })
      toast({ title: 'Success', description: 'Session logged out successfully' })
      setSessionToLogout(null)
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to logout session', variant: 'destructive' })
    }
  })

  const logoutAllMutation = useMutation({
    mutationFn: logoutOtherSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session-analytics'] })
      toast({ title: 'Success', description: 'All other sessions logged out successfully' })
      setShowLogoutAllDialog(false)
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to logout other sessions', variant: 'destructive' })
    }
  })

  const getDeviceIcon = (device: string) => {
    const deviceLower = device.toLowerCase()
    if (deviceLower.includes('mobile') || deviceLower.includes('phone')) {
      return <Smartphone className="h-5 w-5" />
    }
    if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
      return <Tablet className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const activeSessions = sessions?.filter(s => !s.is_current) || []
  const currentSession = sessions?.find(s => s.is_current)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Active Sessions</h1>
            <p className="text-muted-foreground mt-1">
              Manage your active login sessions across all devices
            </p>
          </div>
          {activeSessions.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowLogoutAllDialog(true)}
              disabled={logoutAllMutation.isPending}
            >
              {logoutAllMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout All Other Sessions
                </>
              )}
            </Button>
          )}
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_sessions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.active_sessions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Desktop</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.devices.find(d => d.device === 'desktop')?.count || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Mobile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.devices.find(d => d.device === 'mobile')?.count || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Alert */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            If you see any sessions you don't recognize, logout that session immediately and change your password.
          </AlertDescription>
        </Alert>

        {/* Current Session */}
        {currentSession && (
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(currentSession.device)}
                  <div>
                    <CardTitle className="text-lg">Current Session</CardTitle>
                    <CardDescription>{currentSession.browser} on {currentSession.os}</CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Active Now
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{currentSession.ip_address}</span>
                {currentSession.location && <span>• {currentSession.location}</span>}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last activity: {formatLastActivity(currentSession.last_active)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other Sessions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Other Sessions</h2>
          
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <p className="text-lg font-medium">No other active sessions</p>
                <p className="text-muted-foreground mt-1">
                  You're only logged in on this device
                </p>
              </CardContent>
            </Card>
          ) : (
            activeSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.device)}
                      <div>
                        <CardTitle className="text-lg">{session.device}</CardTitle>
                        <CardDescription>{session.browser} on {session.os}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setSessionToLogout(session.id)}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{session.ip_address}</span>
                    {session.location && <span>• {session.location}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Last activity: {formatLastActivity(session.last_active)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Logout Single Session Dialog */}
      <Dialog open={!!sessionToLogout} onOpenChange={() => setSessionToLogout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout this session?</DialogTitle>
            <DialogDescription>
              This will end the session on that device. You'll need to login again to access your account from that device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionToLogout(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => sessionToLogout && logoutMutation.mutate(sessionToLogout)}
            >
              Logout Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout All Sessions Dialog */}
      <Dialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout all other sessions?</DialogTitle>
            <DialogDescription>
              This will end all sessions except your current one. You'll need to login again on those devices.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutAllDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => logoutAllMutation.mutate()}
            >
              Logout All Other Sessions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
