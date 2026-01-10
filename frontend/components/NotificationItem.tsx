'use client'

import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/lib/notifications/provider'

type NotificationItemProps = {
  notification: {
    id: number
    title: string
    message: string
    is_read: boolean
    created_at: string
    metadata?: Record<string, any>
  }
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead } = useNotifications()
  
  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id.toString())
    }
  }
  
  return (
    <div 
      className={`p-4 hover:bg-accent transition-colors cursor-pointer ${notification.is_read ? '' : 'bg-accent/50'}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium mb-1">{notification.title}</h4>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </span>
      </div>
      {notification.metadata?.transaction_type === 'wallet_topup' && (
        <div className="mt-2 text-xs text-sikaremit-primary">
          Wallet credited with {notification.metadata.amount} {notification.metadata.currency}
        </div>
      )}
    </div>
  )
}
