import * as React from 'react'
import { NotificationItem } from '@/components/ui/notification-item'
import { getNotifications, type Notification } from '@/lib/api/notifications'

export function NotificationList() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [lastUpdate, setLastUpdate] = React.useState(Date.now())
  
  React.useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getNotifications()
        setNotifications(data.data)
      } catch (error) {
        console.error('Failed to load notifications', error)
      }
    }
    
    // Load immediately
    loadNotifications()
    
    // Set up polling for real-time updates every 10 seconds
    const interval = setInterval(loadNotifications, 10000)
    
    // Listen for localStorage changes (for mock notifications)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mock_notifications') {
        loadNotifications()
        setLastUpdate(Date.now())
      }
    }
    
    // Listen for custom notification update events
    const handleNotificationUpdate = () => {
      loadNotifications()
      setLastUpdate(Date.now())
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('notificationUpdate', handleNotificationUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('notificationUpdate', handleNotificationUpdate)
    }
  }, [])

  // Force update when component re-renders (for programmatic updates)
  React.useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getNotifications()
        setNotifications(data.data)
      } catch (error) {
        console.error('Failed to load notifications', error)
      }
    }
    
    loadNotifications()
  }, [lastUpdate])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // For mock notifications, update localStorage directly
      const storedNotifications = JSON.parse(localStorage.getItem('mock_notifications') || '[]')
      const updatedNotifications = storedNotifications.map((n: any) => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
      localStorage.setItem('mock_notifications', JSON.stringify(updatedNotifications))
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === parseInt(notificationId) ? { ...n, isRead: true } : n
      ))
      
      // Trigger storage event for other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'mock_notifications',
        newValue: JSON.stringify(updatedNotifications)
      }))
      
    } catch (error) {
      console.error('Failed to mark notification as read', error)
    }
  }

  return (
    <div className="divide-y divide-border max-h-96 overflow-hidden">
      <div className="p-4 font-semibold text-foreground border-b border-border bg-muted/50">
        Notifications
        {notifications.length > 0 && (
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            ({notifications.filter(n => !n.is_read).length} unread)
          </span>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification}
              onClick={handleMarkAsRead}
            />
          ))
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <div className="text-2xl mb-2">🔔</div>
            No new notifications
          </div>
        )}
      </div>
      {notifications.length > 0 && (
        <div className="p-3 text-center border-t border-border bg-muted/30">
          <button className="text-xs text-primary hover:underline font-medium">
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}
