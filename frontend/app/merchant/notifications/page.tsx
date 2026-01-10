'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  CheckCircle,
  X,
  Trash2,
  RefreshCw,
  Settings,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Shield,
  Mail,
  Smartphone,
  Volume2,
  VolumeX
} from 'lucide-react'
import {
  getMerchantNotifications,
  markMerchantNotificationAsRead,
  markAllMerchantNotificationsAsRead,
  getMerchantNotificationSettings,
  updateMerchantNotificationSettings
} from '@/lib/api/merchant'
import { useToast } from '@/hooks/use-toast'

interface MerchantNotification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'info' | 'error'
  category: 'transaction' | 'payout' | 'security' | 'system' | 'customer'
  time: string
  read: boolean
  actionUrl?: string
  metadata?: any
}

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  transactionAlerts: boolean
  payoutAlerts: boolean
  securityAlerts: boolean
  customerAlerts: boolean
  marketingEmails: boolean
}

export default function MerchantNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
    transactionAlerts: true,
    payoutAlerts: true,
    securityAlerts: true,
    customerAlerts: true,
    marketingEmails: false
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: notifications,
    isLoading,
    refetch,
    isRefetching
  } = useQuery<MerchantNotification[]>({
    queryKey: ['merchant-notifications'],
    queryFn: getMerchantNotifications,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const filteredNotifications = (notifications || []).filter(notification => {
    const matchesReadFilter =
      filter === 'all' ||
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read)

    const matchesCategoryFilter =
      categoryFilter === 'all' || notification.category === categoryFilter

    return matchesReadFilter && matchesCategoryFilter
  })

  const unreadCount = (notifications || []).filter(n => !n.read).length

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markMerchantNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-notifications'] })
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllMerchantNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-notifications'] })
      toast({
        title: 'All notifications marked as read',
        description: 'All notifications have been marked as read.',
      })
    }
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: NotificationSettings) => updateMerchantNotificationSettings(newSettings),
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Notification preferences have been saved.',
      })
    }
  })

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const handleSettingsChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    updateSettingsMutation.mutate(newSettings)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'error':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return <Bell className="w-5 h-5 text-blue-500" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transaction':
        return <DollarSign className="w-4 h-4 text-green-600" />
      case 'payout':
        return <DollarSign className="w-4 h-4 text-purple-600" />
      case 'security':
        return <Shield className="w-4 h-4 text-red-600" />
      case 'customer':
        return <ShoppingCart className="w-4 h-4 text-blue-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20'
      case 'warning':
        return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-700">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-indigo-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-cyan-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl">
                <Bell className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Notifications Center
                </h1>
                <p className="text-purple-200/80 text-lg mt-1">
                  Stay updated with your business activities and alerts
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <Bell className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">{unreadCount} unread</span>
              </div>
              <Button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200/70 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{notifications?.length || 0}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200/70 text-sm">Unread</p>
                  <p className="text-2xl font-bold text-white">{unreadCount}</p>
                </div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200/70 text-sm">Today</p>
                  <p className="text-2xl font-bold text-white">
                    {(notifications || []).filter(n => n.time.includes('hour') || n.time.includes('minute')).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200/70 text-sm">Critical</p>
                  <p className="text-2xl font-bold text-white">
                    {(notifications || []).filter(n => n.type === 'error' || n.type === 'warning').length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Filters */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-1 duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-400/20 to-indigo-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>

            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex space-x-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    size="sm"
                  >
                    All ({notifications?.length || 0})
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'outline'}
                    onClick={() => setFilter('unread')}
                    size="sm"
                  >
                    Unread ({unreadCount})
                  </Button>
                  <Button
                    variant={filter === 'read' ? 'default' : 'outline'}
                    onClick={() => setFilter('read')}
                    size="sm"
                  >
                    Read ({(notifications?.length || 0) - unreadCount})
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="all">All Categories</option>
                    <option value="transaction">Transactions</option>
                    <option value="payout">Payouts</option>
                    <option value="security">Security</option>
                    <option value="customer">Customers</option>
                    <option value="system">System</option>
                  </select>
                </div>

                {unreadCount > 0 && (
                  <Button onClick={handleMarkAllAsRead} disabled={markAllAsReadMutation.isPending}>
                    Mark All as Read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-2 duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"></div>

            <CardHeader className="relative z-10 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Bell className="w-7 h-7 mr-3 text-purple-600" />
                    Recent Notifications
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-lg mt-1">
                    {filteredNotifications.length} notifications • Stay informed about your business
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                  Live Updates
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative z-10">
              {isLoading ? (
                <div className="p-8 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bell className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    No notifications found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                    {filter !== 'all' ? `No ${filter} notifications in this category` : 'You\'re all caught up!'}
                  </p>
                  <Button onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredNotifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 animate-in slide-in-from-left duration-500 ${
                        !notification.read ? getNotificationColor(notification.type) : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center space-x-1">
                                  {getCategoryIcon(notification.category)}
                                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {notification.category}
                                  </span>
                                </div>
                              </div>

                              <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                                {notification.message}
                              </p>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {notification.time}
                                </span>

                                <div className="flex items-center space-x-2">
                                  {!notification.read && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      disabled={markAsReadMutation.isPending}
                                    >
                                      Mark as Read
                                    </Button>
                                  )}

                                  {notification.actionUrl && (
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={notification.actionUrl}>View Details</a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-1 duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-400/20 to-indigo-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>

            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Settings className="w-7 h-7 mr-3 text-purple-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-lg">
                Choose how and when you want to be notified about business activities
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 relative z-10">
              {/* Communication Channels */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
                  Communication Channels
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <Label className="text-base font-medium">Email Notifications</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.email}
                      onCheckedChange={(checked) => handleSettingsChange('email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                      <div>
                        <Label className="text-base font-medium">SMS Notifications</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.sms}
                      onCheckedChange={(checked) => handleSettingsChange('sms', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-green-600" />
                      <div>
                        <Label className="text-base font-medium">Push Notifications</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Browser notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.push}
                      onCheckedChange={(checked) => handleSettingsChange('push', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Alert Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
                  Alert Types
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Transaction Alerts</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payments received, refunds, etc.</p>
                    </div>
                    <Switch
                      checked={settings.transactionAlerts}
                      onCheckedChange={(checked) => handleSettingsChange('transactionAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Payout Alerts</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payout processing and completion</p>
                    </div>
                    <Switch
                      checked={settings.payoutAlerts}
                      onCheckedChange={(checked) => handleSettingsChange('payoutAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Security Alerts</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Login attempts, suspicious activity</p>
                    </div>
                    <Switch
                      checked={settings.securityAlerts}
                      onCheckedChange={(checked) => handleSettingsChange('securityAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Customer Alerts</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">New customers, high-value purchases</p>
                    </div>
                    <Switch
                      checked={settings.customerAlerts}
                      onCheckedChange={(checked) => handleSettingsChange('customerAlerts', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Marketing Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-indigo-600" />
                  Marketing & Updates
                </h3>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Marketing Emails</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Product updates, tips, and promotional content</p>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => handleSettingsChange('marketingEmails', checked)}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => updateSettingsMutation.mutate(settings)}
                  disabled={updateSettingsMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
