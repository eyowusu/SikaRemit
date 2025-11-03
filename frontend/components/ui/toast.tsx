import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitive.Provider

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      'fixed right-4 top-4 z-50 w-auto rounded-lg bg-gray-900 p-4 text-white shadow-lg',
      className
    )}
    {...props}
  />
))
Toast.displayName = ToastPrimitive.Root.displayName

export { ToastProvider, Toast }
