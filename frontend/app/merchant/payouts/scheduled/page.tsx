'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Clock,
  DollarSign,
  CheckCircle2,
  Pause,
  Play
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CronEditor } from '@/components/cron/cron-editor'
import { useToast } from '@/hooks/use-toast'
import { useCurrency } from '@/hooks/useCurrency'
import api from '@/lib/api/axios'

interface ScheduledPayout {
  id: number
  merchant_id: number
  amount: number
  currency: string
  schedule: string
  is_active: boolean
  next_execution: string
  last_execution?: string
  execution_count: number
  created_at: string
  payment_method: string
}

async function getScheduledPayouts(): Promise<ScheduledPayout[]> {
  const response = await api.get('/api/v1/payments/scheduled-payouts/')
  return response.data
}

async function createScheduledPayout(data: {
  amount: number
  schedule: string
  payment_method: string
}): Promise<ScheduledPayout> {
  const response = await api.post('/api/v1/payments/scheduled-payouts/', data)
  return response.data
}

async function updateScheduledPayout(id: number, data: Partial<ScheduledPayout>): Promise<ScheduledPayout> {
  const response = await api.patch(`/api/v1/payments/scheduled-payouts/${id}/`, data)
  return response.data
}

async function deleteScheduledPayout(id: number): Promise<void> {
  await api.delete(`/api/v1/payments/scheduled-payouts/${id}/`)
}

export default function ScheduledPayoutsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { formatAmount } = useCurrency()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<ScheduledPayout | null>(null)
  const [formData, setFormData] = useState({
    amount: '',
    schedule: '0 0 * * *',
    payment_method: 'bank_transfer'
  })

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['scheduled-payouts'],
    queryFn: getScheduledPayouts,
    refetchInterval: 30000
  })

  const createMutation = useMutation({
    mutationFn: createScheduledPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payouts'] })
      toast({ title: 'Success', description: 'Scheduled payout created successfully' })
      setShowCreateDialog(false)
      resetForm()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create scheduled payout', variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ScheduledPayout> }) =>
      updateScheduledPayout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payouts'] })
      toast({ title: 'Success', description: 'Scheduled payout updated successfully' })
      setShowEditDialog(false)
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update scheduled payout', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteScheduledPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payouts'] })
      toast({ title: 'Success', description: 'Scheduled payout deleted successfully' })
      setShowDeleteDialog(false)
      setSelectedPayout(null)
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete scheduled payout', variant: 'destructive' })
    }
  })

  const resetForm = () => {
    setFormData({
      amount: '',
      schedule: '0 0 * * *',
      payment_method: 'bank_transfer'
    })
  }

  const handleCreate = () => {
    if (!formData.amount || !formData.schedule) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }
    createMutation.mutate({
      amount: parseFloat(formData.amount),
      schedule: formData.schedule,
      payment_method: formData.payment_method
    })
  }

  const handleToggleActive = (payout: ScheduledPayout) => {
    updateMutation.mutate({
      id: payout.id,
      data: { is_active: !payout.is_active }
    })
  }

  const handleEdit = (payout: ScheduledPayout) => {
    setSelectedPayout(payout)
    setFormData({
      amount: payout.amount.toString(),
      schedule: payout.schedule,
      payment_method: payout.payment_method
    })
    setShowEditDialog(true)
  }

  const handleUpdate = () => {
    if (!selectedPayout) return
    updateMutation.mutate({
      id: selectedPayout.id,
      data: {
        amount: parseFloat(formData.amount),
        schedule: formData.schedule,
        payment_method: formData.payment_method
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Scheduled Payouts
            </h1>
            <p className="text-muted-foreground mt-1">
              Automate recurring payouts with cron schedules
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Payout
          </Button>
        </div>

        {/* Summary Cards */}
        {payouts && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payouts.length}</div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {payouts.filter(p => p.is_active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {payouts.reduce((sum, p) => sum + p.execution_count, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Monthly Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(payouts.reduce((sum, p) => sum + (p.is_active ? p.amount : 0), 0))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payouts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : payouts && payouts.length > 0 ? (
            payouts.map((payout) => (
              <Card key={payout.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          {formatAmount(payout.amount)}
                        </CardTitle>
                        <Badge variant={payout.is_active ? 'default' : 'secondary'}>
                          {payout.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <CardDescription>
                        {payout.payment_method.replace('_', ' ').toUpperCase()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={payout.is_active}
                        onCheckedChange={() => handleToggleActive(payout)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Schedule</p>
                      <p className="font-mono text-sm">{payout.schedule}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Execution</p>
                      <p className="font-semibold">
                        {new Date(payout.next_execution).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Execution</p>
                      <p className="font-semibold">
                        {payout.last_execution
                          ? new Date(payout.last_execution).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Executions</p>
                      <p className="font-semibold">{payout.execution_count}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(payout)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedPayout(payout)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No scheduled payouts</p>
                <p className="text-muted-foreground mt-1">
                  Create your first scheduled payout to automate payments
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Payout
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Payout</DialogTitle>
            <DialogDescription>
              Configure automatic recurring payouts with cron scheduling
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payout Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                placeholder="bank_transfer"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Schedule (Cron Expression)</Label>
              <CronEditor
                value={formData.schedule}
                onChange={(schedule) => setFormData({ ...formData, schedule })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Payout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Payout</DialogTitle>
            <DialogDescription>
              Update payout amount and schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_amount">Payout Amount</Label>
              <Input
                id="edit_amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_payment_method">Payment Method</Label>
              <Input
                id="edit_payment_method"
                placeholder="bank_transfer"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Schedule (Cron Expression)</Label>
              <CronEditor
                value={formData.schedule}
                onChange={(schedule) => setFormData({ ...formData, schedule })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Payout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scheduled Payout</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scheduled payout? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPayout && deleteMutation.mutate(selectedPayout.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
