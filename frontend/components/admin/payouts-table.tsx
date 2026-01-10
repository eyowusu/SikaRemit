'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Check, X, Eye } from 'lucide-react'
import type { Payout } from '@/lib/types/payout'
import type { Merchant } from '@/lib/types/merchant'

interface PayoutsTableProps {
  payouts: Payout[]
  merchants: Merchant[]
  onRefresh: () => void
}

export function PayoutsTable({ payouts, merchants, onRefresh }: PayoutsTableProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
  }

  const getMerchantName = (merchantId: string) => {
    const merchant = merchants.find(m => m.id === merchantId)
    return merchant?.business_name || merchant?.email || 'Unknown'
  }

  const getStatusColor = (status: Payout['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'processing':
        return 'default'
      case 'completed':
        return 'default'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Payout Requests</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No payout requests found
                </TableCell>
              </TableRow>
            ) : (
              payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-medium">
                    {getMerchantName(payout.merchant_id)}
                  </TableCell>
                  <TableCell>{formatCurrency(payout.amount)}</TableCell>
                  <TableCell className="capitalize">{payout.payment_method.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(payout.status)}>
                      {payout.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(payout.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payout.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
