'use client'

import { PayoutMetrics } from '@/components/admin/payout-metrics'
import { PayoutsTable } from '@/components/admin/payouts-table'
import type { Payout } from '@/lib/types/payout'
import type { Merchant } from '@/lib/types/merchant'

export default function PayoutsPage() {
  // Data fetching would happen here in real implementation
  const payouts: Payout[] = []
  const merchants: Merchant[] = []
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payout Management</h1>
      <PayoutMetrics />
      <PayoutsTable 
        payouts={payouts}
        merchants={merchants}
        onRefresh={() => console.log('refresh')} // TODO: Implement
      />
    </div>
  )
}
