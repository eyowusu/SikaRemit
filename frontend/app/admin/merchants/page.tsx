import { MerchantsTable } from '@/components/admin/merchants-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminMerchantsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantsTable />
        </CardContent>
      </Card>
    </div>
  )
}
