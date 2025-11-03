import * as React from 'react'
import { cn } from '@/lib/utils'

type NotificationItemProps = {
  notification: {
    id: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
    type: string
  }
}

export function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <div className={cn(
      'p-4 hover:bg-gray-50 transition-colors',
      !notification.isRead && 'bg-blue-50'
    )}>
      <div className="flex justify-between items-start">
        <h3 className="font-medium">{notification.title}</h3>
        <span className="text-xs text-gray-500">
          {new Date(notification.createdAt).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
    </div>
  )
}
