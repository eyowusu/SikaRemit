import { useEffect, useState } from 'react'
import { getMerchant } from '@/lib/api/merchant'
import { Merchant, MerchantPaymentLimits } from '@/lib/types/merchant'
import { formatCurrency } from '@/lib/utils/currency'

export function useMerchant(merchantId: string) {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [limits, setLimits] = useState<MerchantPaymentLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const data = await getMerchant(merchantId)
        
        const merchant: Merchant = {
          id: data.id,
          email: data.email,
          businessName: data.businessName || '',
          balance: data.balance || 0,
          available_balance: data.available_balance || data.balance || 0,
          pending_balance: data.pending_balance || 0,
          verificationStatus: data.verificationStatus,
          totalRevenue: data.totalRevenue,
          default_payout_method: data.default_payout_method ? {
            id: data.default_payout_method.id,
            type: data.default_payout_method.type as 'bank' | 'mobile_money',
            verified: Boolean(data.default_payout_method.verified)
          } : undefined
        }
        
        setMerchant(merchant)
        
        setLimits({
          maxAmount: 10000,
          currency: 'USD',
          allowedMethods: ['card', 'bank_transfer']
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load merchant'))
      } finally {
        setLoading(false)
      }
    }

    fetchMerchantData()
  }, [merchantId])

  return { merchant, limits, loading, error }
}
