import * as React from 'react'
import { Payout } from '@/lib/types/payout'
import { WebhookEvent } from '@/lib/types/payout'
import { getPayoutsNeedingApproval, approvePayout, rejectPayout } from '@/lib/api/merchant'
import { getAdminNotifications, getSmsDeliveryStatus } from '@/lib/api/notifications'
import { useToast } from '@/hooks/use-toast'
import { usePayoutWebhooks } from '@/hooks/useWebhooks'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import axios from 'axios'

export function PayoutApproval() {
  const [payouts, setPayouts] = React.useState<Payout[]>([])
  const [smsStatus, setSmsStatus] = React.useState<Record<string, string>>({})
  const { toast } = useToast()

  usePayoutWebhooks((event) => {
    if (!event) return
    
    // Handle different event types
    if (event.event_type === 'payout_processed') {
      setPayouts(prev => prev.filter(p => p.id !== event.payout_id))
    }
    if (event.event_type === 'payout_failed') {
      toast({
        title: 'Payout Failed',
        description: `Payout ${event.payout_id} failed: ${event.metadata?.failure_reason || 'Unknown reason'}`,
        variant: 'destructive'
      })
    }
  }, process.env.WEBHOOK_SECRET)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [payouts, notifications] = await Promise.all([
          getPayoutsNeedingApproval(),
          getAdminNotifications('current-admin-id')
        ])
        setPayouts(payouts)
        // Mark notifications as read
        await axios.patch('/api/notifications/mark-read')
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' })
      }
    }
    loadData()
  }, [])

  const handleApprove = async (payoutId: string) => {
    try {
      await approvePayout(payoutId, 'current-admin-id')
      setPayouts(payouts.filter(p => p.id !== payoutId))
      toast({
        title: 'Success',
        description: 'Payout approved',
      })
      await checkSmsStatus(payoutId)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve payout',
        variant: 'destructive'
      })
    }
  }

  const handleReject = async (payoutId: string, reason: string) => {
    try {
      await rejectPayout(payoutId, 'current-admin-id', reason)
      setPayouts(payouts.filter(p => p.id !== payoutId))
      toast({
        title: 'Success',
        description: 'Payout rejected',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject payout',
        variant: 'destructive'
      })
    }
  }

  const checkSmsStatus = async (payoutId: string) => {
    try {
      const { status } = await getSmsDeliveryStatus(payoutId)
      setSmsStatus(prev => ({
        ...prev,
        [payoutId]: status
      }))
    } catch (error) {
      console.error('Failed to check SMS status', error)
    }
  }

  const columns: ColumnDef<Payout>[] = [
    {
      accessorKey: 'merchant_email',
      header: 'Merchant',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
    },
    {
      accessorKey: 'method',
      header: 'Method',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleApprove(row.original.id)}
            className="px-3 py-1 bg-green-100 text-green-800 rounded"
          >
            Approve
          </button>
          <button 
            onClick={() => {
              const reason = prompt('Rejection reason:')
              if (reason) handleReject(row.original.id, reason)
            }}
            className="px-3 py-1 bg-red-100 text-red-800 rounded"
          >
            Reject
          </button>
        </div>
      )
    }
  ]

  return <DataTable columns={columns} data={payouts} />
}
