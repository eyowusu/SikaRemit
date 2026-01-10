'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Building2,
  Loader2
} from 'lucide-react'
import { getPendingBills, addLateFee, payBill, type PendingBill } from '@/lib/api/payments'
import { useToast } from '@/hooks/use-toast'
import { useCurrency } from '@/hooks/useCurrency'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PendingBillsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { formatAmount } = useCurrency()
  const [selectedBill, setSelectedBill] = useState<PendingBill | null>(null)
  const [lateFeeAmount, setLateFeeAmount] = useState('')
  const [showLateFeeDialog, setShowLateFeeDialog] = useState(false)
  const [showPayDialog, setShowPayDialog] = useState(false)

  const { data: pendingBills, isLoading } = useQuery({
    queryKey: ['pending-bills'],
    queryFn: getPendingBills,
    refetchInterval: 60000 // Refresh every minute
  })

  const addLateFeeMutation = useMutation({
    mutationFn: ({ billId, lateFee }: { billId: string; lateFee: number }) =>
      addLateFee(billId, lateFee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-bills'] })
      toast({ title: 'Success', description: 'Late fee added successfully' })
      setShowLateFeeDialog(false)
      setLateFeeAmount('')
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add late fee', variant: 'destructive' })
    }
  })

  const payBillMutation = useMutation({
    mutationFn: ({ billId, paymentMethodId }: { billId: string; paymentMethodId: string }) =>
      payBill(billId, paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-bills'] })
      toast({ title: 'Success', description: 'Bill paid successfully' })
      setShowPayDialog(false)
      setSelectedBill(null)
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to pay bill', variant: 'destructive' })
    }
  })

  const handleAddLateFee = () => {
    if (!selectedBill || !lateFeeAmount) return
    
    const fee = parseFloat(lateFeeAmount)
    if (isNaN(fee) || fee <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid late fee amount', variant: 'destructive' })
      return
    }

    addLateFeeMutation.mutate({ billId: selectedBill.id, lateFee: fee })
  }

  const getDaysOverdueText = (days?: number) => {
    if (!days || days <= 0) return null
    if (days === 1) return '1 day overdue'
    return `${days} days overdue`
  }

  const getBillTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      utility: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      tax: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      loan: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rent: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
    return colors[type] || colors.other
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const overdueBills = pendingBills?.filter(bill => bill.is_overdue) || []
  const upcomingBills = pendingBills?.filter(bill => !bill.is_overdue) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Pending Bills</h1>
          <p className="text-muted-foreground mt-1">
            Manage your upcoming and overdue bill payments
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingBills?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {overdueBills.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Amount Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(
                  pendingBills?.reduce((sum, bill) => sum + bill.amount + (bill.late_fee || 0), 0) || 0
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Bills */}
        {overdueBills.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">
                Overdue Bills ({overdueBills.length})
              </h2>
            </div>

            {overdueBills.map((bill) => (
              <Card key={bill.id} className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <CardTitle>{bill.bill_issuer}</CardTitle>
                      </div>
                      <CardDescription>Ref: {bill.bill_reference}</CardDescription>
                    </div>
                    <Badge className={getBillTypeColor(bill.bill_type)}>
                      {bill.bill_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">{formatAmount(bill.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Late Fee</p>
                      <p className="font-semibold text-red-600">
                        {formatAmount(bill.late_fee || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Due</p>
                      <p className="font-semibold text-lg">
                        {formatAmount(bill.amount + (bill.late_fee || 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-semibold">{new Date(bill.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {getDaysOverdueText(bill.days_overdue)}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedBill(bill)
                        setShowPayDialog(true)
                      }}
                      className="flex-1"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Pay Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedBill(bill)
                        setShowLateFeeDialog(true)
                      }}
                    >
                      Add Late Fee
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                Upcoming Bills ({upcomingBills.length})
              </h2>
            </div>

            {upcomingBills.map((bill) => (
              <Card key={bill.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <CardTitle>{bill.bill_issuer}</CardTitle>
                      </div>
                      <CardDescription>Ref: {bill.bill_reference}</CardDescription>
                    </div>
                    <Badge className={getBillTypeColor(bill.bill_type)}>
                      {bill.bill_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold text-lg">{formatAmount(bill.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(bill.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant="secondary">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        On Time
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedBill(bill)
                      setShowPayDialog(true)
                    }}
                    className="w-full"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Pay Bill
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {(!pendingBills || pendingBills.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No pending bills</p>
              <p className="text-muted-foreground mt-1">
                You're all caught up! No bills are currently pending.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Late Fee Dialog */}
      <Dialog open={showLateFeeDialog} onOpenChange={setShowLateFeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Late Fee</DialogTitle>
            <DialogDescription>
              Add a late fee to {selectedBill?.bill_issuer}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lateFee">Late Fee Amount</Label>
              <Input
                id="lateFee"
                type="number"
                placeholder="0.00"
                value={lateFeeAmount}
                onChange={(e) => setLateFeeAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLateFeeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddLateFee}
              disabled={addLateFeeMutation.isPending || !lateFeeAmount}
            >
              {addLateFeeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Late Fee'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Bill Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Bill</DialogTitle>
            <DialogDescription>
              Confirm payment for {selectedBill?.bill_issuer}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bill Amount:</span>
                <span className="font-semibold">{formatAmount(selectedBill?.amount || 0)}</span>
              </div>
              {selectedBill && (selectedBill.late_fee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Late Fee:</span>
                  <span className="font-semibold text-red-600">
                    {formatAmount(selectedBill.late_fee || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">
                  {formatAmount((selectedBill?.amount || 0) + (selectedBill?.late_fee || 0))}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedBill && payBillMutation.mutate({ billId: selectedBill.id, paymentMethodId: '' })}
              disabled={payBillMutation.isPending}
            >
              {payBillMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
