'use client'

import { useNotifications } from '@/lib/notifications/provider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationItem } from './NotificationItem'
import { Button } from '@/components/ui/button'

export function NotificationList() {
  const { notifications, unreadCount } = useNotifications()
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-medium">Notifications</h3>
        {unreadCount > 0 && (
          <span className="text-xs text-sikaremit-primary">
            {unreadCount} unread
          </span>
        )}
      </div>
      <ScrollArea className="h-72">
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
              />
            ))}
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}
      </ScrollArea>
      {notifications.length > 0 && (
        <div className="border-t p-2 text-center">
          <Button variant="ghost" size="sm">
            View all notifications
          </Button>
        </div>
      )}
    </div>
  )
}
