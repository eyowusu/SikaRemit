import * as React from 'react'
import { NotificationItem } from '@/components/ui/notification-item'
import { getNotifications } from '@/lib/api/notifications'

type Notification = {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  type: string
}

export function NotificationList() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  
  React.useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getNotifications()
        setNotifications(data)
      } catch (error) {
        console.error('Failed to load notifications', error)
      }
    }
    loadNotifications()
  }, [])

  return (
    <div className="divide-y">
      <div className="p-4 font-medium">Notifications</div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
            />
          ))
        ) : (
          <div className="p-4 text-sm text-gray-500">No new notifications</div>
        )}
      </div>
    </div>
  )
}
