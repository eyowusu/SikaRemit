'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import { verifyMerchant } from '@/lib/api/merchant'
import { useToast } from '@/hooks/use-toast'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { getMerchants } from '@/lib/api/merchant'
import { Merchant } from '@/lib/types/merchant'

export function MerchantsTable() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadMerchants = async () => {
      try {
        const data = await getMerchants()
        setMerchants(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load merchants',
          variant: 'destructive',
        })
      }
    }
    loadMerchants()
  }, [])

  const verifyMerchantHandler = async (id: string) => {
    try {
      await verifyMerchant(id)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify merchant',
        variant: 'destructive',
      })
    }
  }

  const columns: ColumnDef<Merchant>[] = [
    {
      accessorKey: 'businessName',
      header: 'Business',
    },
    {
      accessorKey: 'verificationStatus',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.verificationStatus === 'verified' ? 'success' : 'warning'}>
          {row.original.verificationStatus || 'pending'}
        </Badge>
      )
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <Badge variant="default">
          {row.original.email}
        </Badge>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => verifyMerchantHandler(row.original.id)}
              disabled={row.original.verificationStatus === 'verified'}
            >
              Verify
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]
  
  return (
    <DataTable 
      columns={columns} 
      data={merchants}
      aria-label="Merchants table"
      mobileCardView={true}
    />
  )
}
