'use client'

import * as React from 'react'
import { Bell, BellDot, Check, AlertTriangle, Info, CreditCard, Shield, Users, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface AdminNotification {
  id: number
  title: string
  message: string
  level: 'info' | 'warning' | 'success' | 'error' | 'payment' | 'security'
  notification_type: string
  is_read: boolean
  created_at: string
  metadata: Record<string, any>
}

async function fetchAdminNotifications(): Promise<AdminNotification[]> {
  const token = localStorage.getItem('access_token')
  const response = await axios.get(`${API_URL}/api/v1/notifications/`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 10 }
  })
  return response.data.results || response.data || []
}

async function markAsRead(notificationId: number): Promise<void> {
  const token = localStorage.getItem('access_token')
  await axios.patch(`${API_URL}/api/v1/notifications/${notificationId}/read/`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

async function markAllAsRead(): Promise<void> {
  const token = localStorage.getItem('access_token')
  await axios.patch(`${API_URL}/api/v1/notifications/mark_all_read/`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

function getNotificationIcon(type: string, level: string) {
  // KYC/Verification related
  if (type?.includes('kyc') || type?.includes('verification')) {
    return <FileCheck className="h-4 w-4 text-blue-500" />
  }
  // User/Account related
  if (type?.includes('user') || type?.includes('account') || type?.includes('merchant')) {
    return <Users className="h-4 w-4 text-purple-500" />
  }
  // Payment/Transaction related
  if (type?.includes('payment') || type?.includes('transaction') || type?.includes('withdrawal')) {
    return <CreditCard className="h-4 w-4 text-green-500" />
  }
  // Security related
  if (type?.includes('security') || level === 'security') {
    return <Shield className="h-4 w-4 text-red-500" />
  }
  // Warning
  if (level === 'warning' || level === 'error') {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }
  // Default
  return <Info className="h-4 w-4 text-gray-500" />
}

function getLevelColor(level: string) {
  switch (level) {
    case 'error':
      return 'bg-red-50 border-l-4 border-red-500'
    case 'warning':
      return 'bg-yellow-50 border-l-4 border-yellow-500'
    case 'success':
      return 'bg-green-50 border-l-4 border-green-500'
    case 'security':
      return 'bg-red-50 border-l-4 border-red-500'
    case 'payment':
      return 'bg-blue-50 border-l-4 border-blue-500'
    default:
      return 'bg-gray-50 border-l-4 border-gray-300'
  }
}

export function AdminNotificationBell() {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: fetchAdminNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false
  })

  // Ensure notifications is always an array
  const notifications = Array.isArray(notificationsData) ? notificationsData : []

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
    }
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleNotificationClick = (notification: AdminNotification) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellDot className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-white dark:bg-gray-900 border shadow-xl" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-lg">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground/70">
                You'll be notified about KYC verifications, transactions, and system alerts
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.is_read ? getLevelColor(notification.level) : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type, notification.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t">
          <Link href="/admin/notifications" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full" size="sm">
              View all notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
