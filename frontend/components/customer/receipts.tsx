'use client'

import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { getCustomerReceipts } from '@/lib/api/customer'
import { Receipt } from '@/lib/types/customer'

export function Receipts() {
  const { data: receipts, isLoading } = useQuery<Receipt[]>({
    queryKey: ['customer-receipts'],
    queryFn: getCustomerReceipts
  })

  if (isLoading) return <div>Loading receipts...</div>
  
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Receipts</h3>
      {receipts?.length ? (
        <ul className="space-y-2">
          {receipts.map(receipt => (
            <li key={receipt.id} className="flex justify-between items-center">
              <div>
                <div>{receipt.amount} - {receipt.date}</div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={receipt.downloadUrl} download>Download</a>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No receipts found</p>
      )}
    </div>
  )
}
