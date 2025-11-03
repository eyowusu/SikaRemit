'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getPaymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultMethod } from '@/lib/api/payments'
import { PaymentMethod, CreatePaymentMethod } from '@/lib/types/payments'
import { useToast } from '@/hooks/use-toast'

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const loadMethods = async () => {
      try {
        const data = await getPaymentMethods()
        setMethods(data)
      } catch (err) {
        setError('Failed to load payment methods')
        toast({
          title: 'Error',
          description: 'Failed to load payment methods',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadMethods()
  }, [])

  const handleAddMethod = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const method = {
        method_type: formData.get('type') as PaymentMethod['method_type'],
        details: { value: formData.get('details') as string }, // Wrap in object as expected by API
        is_default: formData.get('isDefault') === 'on'
      }
      
      const newMethod = await addPaymentMethod(method)
      setMethods([...methods, newMethod])
      toast({
        title: 'Success',
        description: 'Payment method added successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add payment method',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await deletePaymentMethod(id)
      setMethods(methods.filter(m => m.id !== id))
      toast({
        title: 'Success',
        description: 'Payment method deleted',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment method',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMethod(id)
      setMethods(methods.map(m => ({
        ...m,
        isDefault: m.id === id
      })))
      toast({
        title: 'Success',
        description: 'Default payment method updated',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update default payment method',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleAddMethod(formData);
            }} className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="google_pay">Google Pay</SelectItem>
                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    <SelectItem value="qr_code">QR Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="details">Details</Label>
                <Input id="details" name="details" required />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isDefault" name="isDefault" />
                <Label htmlFor="isDefault">Set as default</Label>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardHeader>
              <CardTitle className="capitalize">{method.method_type.replace('_', ' ')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{typeof method.details === 'object' ? method.details.value || JSON.stringify(method.details) : method.details}</p>
              <div className="flex justify-between items-center">
                {method.is_default ? (
                  <span className="text-sm text-green-500">Default</span>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSetDefault(method.id)}
                  >
                    Set Default
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(method.id)}
                  disabled={isDeleting === method.id}
                >
                  {isDeleting === method.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
