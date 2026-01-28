import { ReactNode } from 'react'
import MerchantLayoutClient from '@/components/merchant/layout-client'

interface MerchantLayoutProps {
  children: ReactNode
}

export default function MerchantLayout({ children }: MerchantLayoutProps) {
  return <MerchantLayoutClient>{children}</MerchantLayoutClient>
}
