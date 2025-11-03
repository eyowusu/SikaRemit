'use client'

import * as React from 'react'
import { Toast } from '@/components/ui/toast'

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive'
}

const TOAST_LIMIT = 1

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])

  const toast = (props: Omit<ToasterToast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    
    setToasts((prev) => {
      const newToast = { ...props, id }
      const newToasts = [newToast, ...prev]
      return newToasts.slice(0, TOAST_LIMIT)
    })
  }

  return {
    toast,
    toasts,
  }
}
