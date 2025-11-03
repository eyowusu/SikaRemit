import { useQuery } from '@tanstack/react-query'
import { getMerchantPayoutsAPI } from '@/lib/api/merchant'

export function PayoutsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-payouts'],
    queryFn: getMerchantPayoutsAPI
  })

  return (
    <div>
      {isLoading ? 'Loading...' : (
        <ul className="space-y-2">
          {data?.map((payout) => (
            <li key={payout.id} className="border p-4 rounded">
              <div>Amount: {payout.amount}</div>
              <div>Status: {payout.status}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
