'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { createPayout } from '@/lib/api/merchant'
import { useToast } from '@/hooks/use-toast'
import type { Payout } from '@/lib/types/payout'
import type { Merchant } from '@/lib/types/merchant'
import { formatCurrency } from '@/lib/utils/currency'
import { usePayoutWebhooks } from '@/hooks/useWebhooks'
import { Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPayouts } from '@/lib/api/payouts'

interface InstantPayoutTableProps {
  payouts?: Payout[]
  merchants?: Merchant[]
  onRefresh?: () => void
}

export function PayoutsTable({ payouts, merchants, onRefresh }: InstantPayoutTableProps) {
  const { toast } = useToast()

  usePayoutWebhooks((event) => {
    if (!event) return
    
    if (event.event_type === 'payout_processed') {
      onRefresh?.()
    }
  })

  const handlePayout = async (merchantId: string, amount: number, method: string) => {
    if (!confirm(`Create ${formatCurrency(amount)} payout? This requires admin approval.`)) return
    
    try {
      await createPayout(merchantId, amount, method, 'pending')
      toast({
        title: 'Success',
        description: 'Payout submitted for approval',
      })
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create payout',
        variant: 'destructive'
      })
    }
  }

  const { 
    data: serverPayouts = [], 
    isLoading, 
    refetch 
  } = useQuery<Payout[]>({
    queryKey: ['payouts'],
    queryFn: getPayouts
  })

  const displayPayouts = payouts || serverPayouts

  const columns: ColumnDef<Payout>[] = [
    {
      accessorKey: 'merchant_email',
      header: 'Merchant',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.getValue('amount'))
    },
    {
      accessorKey: 'method',
      header: 'Method',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'notifications',
      header: 'Notifications',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.notify_by?.includes('email') && <Mail className="h-4 w-4" />}
          {row.original.notify_by?.includes('sms') && <Phone className="h-4 w-4" />}
        </div>
      )
    }
  ]

  return (
    <div className="flex justify-end mb-4">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => refetch()}
        disabled={isLoading}
      >
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
      <DataTable columns={columns} data={displayPayouts} mobileCardView={true} />
    </div>
  )
}
