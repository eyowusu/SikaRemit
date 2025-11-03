'use client'

import { useQuery } from '@tanstack/react-query'
import { getMerchantBalanceAPI } from '@/lib/api/merchant'
import { PayoutRequest } from '@/components/merchant/payout-request'
import { PayoutsList } from '@/components/merchant/payouts-list'

export default function MerchantDashboard() {
  const { data: balance } = useQuery<number>({
    queryKey: ['merchant-balance'],
    queryFn: getMerchantBalanceAPI
  })
  
  return (
    <div className="min-h-screen bg-payglobe-card space-y-6">
      <h1 className="text-2xl font-bold text-payglobe-foreground">Merchant Portal</h1>
      <PayoutRequest balance={balance || 0} />
      <PayoutsList />
    </div>
  )
}
