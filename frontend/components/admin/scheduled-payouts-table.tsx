import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { ScheduledPayout } from '@/lib/types/payout'
import { Merchant } from '@/lib/types/merchant'
import { formatCurrency } from '@/lib/utils/currency'

export function ScheduledPayoutTable({ 
  payouts, 
  merchants 
}: {
  payouts: ScheduledPayout[]
  merchants: Merchant[]
}) {
  const columns: ColumnDef<ScheduledPayout>[] = [
    {
      accessorKey: 'merchant.email',
      header: 'Merchant',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.getValue('amount'))
    },
    {
      accessorKey: 'schedule',
      header: 'Schedule',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    }
  ]

  return <DataTable columns={columns} data={payouts} />
}
