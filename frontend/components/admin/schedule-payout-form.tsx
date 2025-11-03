import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { createScheduledPayout } from '@/lib/api/merchant'
import { Merchant } from '@/lib/types/merchant'
import { formatCurrency } from '@/lib/utils/currency'

type FormData = {
  merchant_id: string
  amount: number
  schedule: string
}

export function SchedulePayoutForm({ merchants }: { merchants: Merchant[] }) {
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = React.useState<FormData>({
    merchant_id: '',
    amount: 0,
    schedule: '0 9 * * 1', // Default: Mondays at 9am,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }))
  }

  const validateCron = (value: string) => {
    const parts = value.split(' ')
    return parts.length === 5
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedMerchant = merchants.find(m => m.id === formData.merchant_id)
    
    if (!validateCron(formData.schedule)) {
      toast({
        title: 'Error',
        description: 'Invalid cron expression format (use: * * * * *)',
        variant: 'destructive',
      })
      return
    }
    
    if (selectedMerchant && formData.amount > (selectedMerchant.available_balance || 0)) {
      toast({
        title: 'Error',
        description: `Amount exceeds available balance of ${formatCurrency(selectedMerchant.available_balance || 0)}`,
        variant: 'destructive',
      })
      return
    }

    try {
      await createScheduledPayout(formData)
      toast({
        title: 'Success',
        description: 'Payout scheduled successfully',
      })
      setOpen(false)
      setFormData({
        merchant_id: '',
        amount: 0,
        schedule: '0 9 * * 1',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule payout',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Schedule New Payout</Button>
      </DialogTrigger>
      <DialogContent>
        <h3 className="text-lg font-semibold">Schedule New Payout</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Merchant</label>
            <select
              name="merchant_id"
              value={formData.merchant_id}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select merchant</option>
              {merchants.map(m => (
                <option key={m.id} value={m.id}>
                  {m.businessName} ({m.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            {formData.merchant_id && (
              <p className="text-xs text-muted-foreground mb-1">
                Available: {formatCurrency(
                  merchants.find(m => m.id === formData.merchant_id)?.available_balance || 0
                )}
              </p>
            )}
            <Input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Schedule (Cron Expression)
            </label>
            <Input
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              placeholder="0 9 * * 1 (Mondays at 9am)"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: minute hour day month weekday
            </p>
            <p className="text-xs text-muted-foreground">
              Example: 0 9 * * 1 = Mondays at 9:00 AM
            </p>
          </div>
          
          <Button type="submit">Schedule Payout</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
