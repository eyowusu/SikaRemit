import * as React from 'react'
import { BellIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationList } from '@/components/ui/notification-list'
import { getNotifications } from '@/lib/api/notifications'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = React.useState(0)
  
  React.useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const notifications = await getNotifications()
        setUnreadCount(notifications.filter(n => !n.isRead).length)
      } catch (error) {
        console.error('Failed to load notifications', error)
      }
    }
    loadUnreadCount()
  }, [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationList />
      </PopoverContent>
    </Popover>
  )
}
