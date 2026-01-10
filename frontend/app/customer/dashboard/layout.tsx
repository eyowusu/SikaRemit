import { ReactNode } from 'react'
import { CustomerHeader } from '@/components/CustomerHeader'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-sikaremit-card">
      <CustomerHeader />
      {children}
    </div>
  )
}
