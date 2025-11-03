'use client'

import { useQuery } from '@tanstack/react-query'
import { getCustomerPayments } from '@/lib/api/customer'
import { Payment } from '@/lib/types/customer'

export function PaymentHistory() {
  const { data, isLoading } = useQuery<Payment[]>({
    queryKey: ['customer-payments'],
    queryFn: getCustomerPayments
  })

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Payment History</h2>
      {isLoading ? 'Loading...' : (
        <ul className="space-y-2">
          {data?.map(payment => (
            <li key={payment.id} className="border p-4 rounded">
              <div>Amount: {payment.amount}</div>
              <div>Date: {payment.date}</div>
              <div>Status: {payment.status}</div>
              <div>To: {payment.recipient}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
