import { PayoutsTable } from '@/components/admin/payouts-table'
import { ScheduledPayoutTable } from '@/components/admin/scheduled-payouts-table'
import { SchedulePayoutForm } from '@/components/admin/schedule-payout-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMerchants, getScheduledPayouts } from '@/lib/api/merchant'

export const dynamic = 'force-dynamic'

export default async function AdminPayoutsPage() {
  const merchants = await getMerchants()
  const scheduledPayouts = await getScheduledPayouts()
  
  return (
    <div className="space-y-4">
      {/* Pending Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <PayoutsTable />
        </CardContent>
      </Card>

      {/* Scheduled Payouts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Scheduled Payouts</CardTitle>
          <SchedulePayoutForm merchants={merchants} />
        </CardHeader>
        <CardContent>
          <ScheduledPayoutTable payouts={scheduledPayouts} merchants={merchants} />
        </CardContent>
      </Card>
    </div>
  )
}
