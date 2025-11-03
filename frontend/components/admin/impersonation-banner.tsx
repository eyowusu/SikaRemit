import * as React from 'react'
import { Button } from '@/components/ui/button'
import { stopImpersonating } from '@/lib/api/impersonate'

type ImpersonationBannerProps = {
  adminEmail: string
  userEmail: string
}

export function ImpersonationBanner({ adminEmail, userEmail }: ImpersonationBannerProps) {
  const handleStopImpersonating = async () => {
    try {
      await stopImpersonating()
      window.location.reload()
    } catch (error) {
      console.error('Failed to stop impersonation', error)
    }
  }

  return (
    <div className="bg-yellow-100 border-y border-yellow-300 text-yellow-800 p-2 text-center">
      <div className="container mx-auto flex justify-between items-center">
        <span>
          You are impersonating <strong>{userEmail}</strong> as <strong>{adminEmail}</strong>
        </span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleStopImpersonating}
          className="border-yellow-500 text-yellow-800 hover:bg-yellow-200"
        >
          Stop Impersonating
        </Button>
      </div>
    </div>
  )
}
