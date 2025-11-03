'use client'

import { useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DisputeForm({ paymentId }: { paymentId: string }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    try {
      await axios.post(`/api/payments/${paymentId}/dispute`, { reason })
      setReason('')
      setError('')
    } catch (err) {
      setError('Failed to submit dispute')
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded">
      <div className="space-y-2">
        <Label htmlFor="reason">Dispute Reason</Label>
        <Input 
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button onClick={handleSubmit}>Submit Dispute</Button>
    </div>
  )
}
