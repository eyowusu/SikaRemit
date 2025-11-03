import { PaymentResponse } from '@/lib/types/merchant'

type PaymentStatusProps = {
  payment: PaymentResponse
}

export function PaymentStatus({ payment }: PaymentStatusProps) {
  return (
    <div>
      <p>Transaction ID: {payment.transactionId}</p>
      <p>Status: {payment.success ? 'Success' : 'Failed'}</p>
      <p>Timestamp: {payment.timestamp}</p>
    </div>
  )
}
