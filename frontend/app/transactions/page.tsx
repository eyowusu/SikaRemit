// import { auth } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getRecentTransactions } from '@/lib/api/accounts'

export const dynamic = 'force-dynamic'

type Transaction = {
  id: string
  amount: number
  description: string
  created_at: string
}

export default async function TransactionsPage() {
  // const session = await auth()
  // if (!session) redirect('/auth/login')

  const transactions = await getRecentTransactions()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      
      <div className="space-y-4">
        {transactions.map((tx: Transaction) => (
          <div key={tx.id} className="border rounded-lg p-4">
            <div className="flex justify-between">
              <span>{tx.description || 'Payment'}</span>
              <span className={`font-medium ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(tx.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
