'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPayout } from '@/lib/api/merchant'

export function PayoutRequest({ balance }: { balance: number }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')

  const handleSubmit = async () => {
    if (!amount) {
      setError('Amount is required')
      return
    }
    
    if (parseFloat(amount) > balance) {
      setError('Amount exceeds balance')
      return
    }
    
    try {
      await requestPayout(parseFloat(amount))
      setAmount('')
      setError('')
    } catch (err) {
      setError('Payout request failed')
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (Available: {balance})</Label>
        <Input 
          id="amount" 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="schedule">Schedule Payout (optional)</Label>
        <Input 
          id="schedule"
          type="datetime-local"
          value={scheduleDate}
          onChange={(e) => setScheduleDate(e.target.value)}
        />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button onClick={handleSubmit}>Request Payout</Button>
    </div>
  )
}
