'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getRecentUsers, updateUserStatus, bulkUpdateUserStatus, searchUsers } from '@/lib/api/admin'
import { useToast } from '@/hooks/use-toast'
import useSWR from 'swr'
import axios from 'axios'
import { useDebounce } from 'use-debounce'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import { impersonateUser } from '@/lib/api/impersonate'

type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  createdAt: string
}

interface UsersTableProps {
  onSelectionChange?: (ids: string[]) => void
}

const fetcher = (url: string) => axios.get(url).then(res => res.data)

export const UsersTable = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery] = useDebounce(searchQuery, 500)
  const [filters, setFilters] = useState({
    role: '',
    isActive: undefined as boolean | undefined
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const { data: users, isLoading, error } = useSWR<User[]>(
    `/api/admin/users/search/?q=${debouncedQuery}&role=${filters.role}&is_active=${filters.isActive}`,
    fetcher
  )
  const { toast } = useToast()

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const updatedUser = await updateUserStatus(id, !currentStatus)
      toast({
        title: 'Success',
        description: `User ${updatedUser.isActive ? 'activated' : 'deactivated'}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      })
    }
  }

  const handleImpersonate = async (userId: string) => {
    try {
      await impersonateUser(userId)
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to impersonate user',
        variant: 'destructive',
      })
    }
  }

  const mobileCardRenderer = (user: User) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground">{user.firstName} {user.lastName}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button 
          variant={user.isActive ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleToggleStatus(user.id, user.isActive)}
          className="min-h-[44px] px-4"
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </Button>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => handleImpersonate(user.id)}
              className="min-h-[44px]"
            >
              Impersonate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  const columns: ColumnDef<User>[] = [
    {
      id: 'select',
      header: ({ table }: any) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllRowsSelected(!!value)
            setSelectedUsers(value ? (users || []).map(user => user.id) : [])
          }}
          aria-label="Select all users"
          data-testid="select-all-users"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(value)
            setSelectedUsers(prev => 
              value ? [...prev, row.original.id] : prev.filter(id => id !== row.original.id)
            )
          }}
          aria-label="Select user"
          data-testid="select-user"
        />
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'firstName',
      header: 'First Name',
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleDateString()
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => (
        <Button 
          variant={row.original.isActive ? 'default' : 'outline'}
          onClick={() => handleToggleStatus(row.original.id, row.original.isActive)}
          aria-label="Toggle user status"
          data-testid="toggle-user-status"
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Button>
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
              onClick={() => handleImpersonate(row.original.id)}
            >
              Impersonate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    try {
      await bulkUpdateUserStatus(selectedUsers, isActive)
      toast({
        title: 'Success',
        description: `Updated ${selectedUsers.length} users`,
      })
      setSelectedUsers([])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update users',
        variant: 'destructive',
      })
    }
  }

  if (error) {
    return <div>Error loading users</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:flex lg:flex-wrap">
        <Input 
          placeholder="Search users..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search users"
          data-testid="search-users"
          className="w-full sm:col-span-2 lg:flex-1 lg:min-w-[200px]"
        />
        <Select 
          value={filters.role} 
          onValueChange={(value) => setFilters({...filters, role: value})}
          aria-label="Filter by role"
          data-testid="filter-by-role"
        >
          <SelectTrigger className="w-full" aria-label="Role filter">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" aria-label="All roles">All Roles</SelectItem>
            <SelectItem value="user" aria-label="User role">User</SelectItem>
            <SelectItem value="merchant" aria-label="Merchant role">Merchant</SelectItem>
            <SelectItem value="admin" aria-label="Admin role">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
          onValueChange={(value) => 
            setFilters({
              ...filters, 
              isActive: value === '' ? undefined : value === 'active'
            })
          }
          aria-label="Filter by status"
          data-testid="filter-by-status"
        >
          <SelectTrigger className="w-full" aria-label="Status filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" aria-label="All statuses">All Statuses</SelectItem>
            <SelectItem value="active" aria-label="Active status">Active</SelectItem>
            <SelectItem value="inactive" aria-label="Inactive status">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={users || []}
          aria-label="Users table"
          tabIndex={0}
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          data-testid="users-table"
          mobileCardView={true}
        />
      )}
    </div>
  )
}
