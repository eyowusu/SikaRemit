'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Users, Search, Plus, Filter, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: number
  role: string // 'admin' | 'merchant' | 'customer' - computed by backend
  is_active: boolean
  created_at: string
}

async function fetchUsers(search: string = ''): Promise<User[]> {
  const token = localStorage.getItem('access_token')
  const response = await axios.get(`${API_URL}/api/v1/accounts/admin/users/`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { search }
  })
  
  // Handle both paginated and non-paginated responses
  const data = response.data
  console.log('Admin users API response:', data)
  let users: User[] = []
  if (data.results && Array.isArray(data.results)) {
    users = data.results
  } else if (Array.isArray(data)) {
    users = data
  }
  console.log('Parsed users with user_type:', users.map(u => ({ email: u.email, user_type: u.user_type })))
  return users
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false) // Hide deleted/inactive users by default
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [createFormData, setCreateFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    user_type: '',
    password: ''
  })
  const [editFormData, setEditFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    user_type: ''
  })

  const queryClient = useQueryClient()

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: () => fetchUsers(debouncedSearch),
    retry: false
  })

  // Filter users based on showInactive toggle
  const users = showInactive ? allUsers : allUsers.filter(user => user.is_active)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setTimeout(() => setDebouncedSearch(value), 300)
  }

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof createFormData) => {
      const token = localStorage.getItem('access_token')
      // Convert user_type to integer for backend
      const payload = {
        ...userData,
        user_type: parseInt(userData.user_type, 10)
      }
      const response = await axios.post(`${API_URL}/api/v1/accounts/admin/users/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('User created successfully')
      setIsCreateDialogOpen(false)
      setCreateFormData({
        email: '',
        first_name: '',
        last_name: '',
        user_type: '',
        password: ''
      })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create user')
    }
  })

  const toggleUserStatusMutation = useMutation({
    mutationFn: async (user: User) => {
      const token = localStorage.getItem('access_token')
      const response = await axios.patch(`${API_URL}/api/v1/accounts/admin/users/${user.id}/`, {
        is_active: !user.is_active // Toggle the current status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('User status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user status')
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number, userData: typeof editFormData }) => {
      const token = localStorage.getItem('access_token')
      // Convert user_type to integer for backend
      const payload = {
        ...userData,
        user_type: parseInt(userData.user_type, 10)
      }
      const response = await axios.patch(`${API_URL}/api/v1/accounts/admin/users/${userId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('User updated successfully')
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user')
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem('access_token')
      const response = await axios.delete(`${API_URL}/api/v1/accounts/admin/users/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    }
  })

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type?.toString() || '3' // Default to customer (3) if undefined
    })
    setIsEditDialogOpen(true)
  }

  const handleToggleUserStatus = (user: User) => {
    if (window.confirm(`Are you sure you want to ${user.is_active ? 'suspend' : 'activate'} this user?`)) {
      toggleUserStatusMutation.mutate(user)
    }
  }

  const handleCreateUser = () => {
    if (!createFormData.email || !createFormData.first_name || !createFormData.last_name || !createFormData.user_type) {
      toast.error('Please fill in all required fields')
      return
    }
    createUserMutation.mutate(createFormData)
  }

  const handleFormChange = (field: string, value: string) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }))
  }

  const getRoleInfo = (role: string) => {
    const roles: Record<string, { label: string, color: string, bgColor: string, icon: string }> = {
      'admin': { label: 'Admin', color: 'text-red-700', bgColor: 'bg-red-100', icon: '👑' },
      'merchant': { label: 'Merchant', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '🏪' },
      'customer': { label: 'Customer', color: 'text-green-700', bgColor: 'bg-green-100', icon: '👤' }
    }
    return roles[role] || { label: 'Unknown', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: '❓' }
  }

  const getUserTypeInfo = (type: number | string) => {
    const numType = typeof type === 'string' ? parseInt(type, 10) : type
    const types: Record<number, { label: string, color: string, bgColor: string, icon: string }> = {
      1: { label: 'Admin', color: 'text-red-700', bgColor: 'bg-red-100', icon: '👑' },
      2: { label: 'Merchant', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '🏪' },
      3: { label: 'Customer', color: 'text-green-700', bgColor: 'bg-green-100', icon: '👤' }
    }
    return types[numType] || { label: 'Unknown', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: '❓' }
  }

  // Use backend's role field which correctly identifies admin via is_staff/is_superuser
  const getDisplayRole = (user: User) => {
    // Backend computes role based on is_staff/is_superuser OR user_type
    if (user.role) {
      return getRoleInfo(user.role)
    }
    // Fallback to user_type if role not available
    return getUserTypeInfo(user.user_type || 3)
  }

  return (
    <>
      <div className="w-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              User Management
            </h1>
            <p className="text-slate-600 mt-1 text-base">Manage all platform users</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 px-6 py-3" onClick={() => setIsCreateDialogOpen(true)} data-testid="create-user-button">
            <Plus className="h-5 w-5 mr-2" />
            Create User
          </Button>
        </div>

        <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-white/50 backdrop-blur-sm border-white/30 focus:border-purple-300"
                  data-testid="search-input"
                />
              </div>
              <Button 
                variant="outline" 
                className={`backdrop-blur-sm border-white/30 shadow-lg shadow-purple-500/5 transition-all duration-300 ${
                  showInactive ? 'bg-purple-100 hover:bg-purple-200 border-purple-300' : 'bg-white/50 hover:bg-white/70 hover:border-purple-200/50'
                }`}
                onClick={() => setShowInactive(!showInactive)}
                data-testid="filter-button"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
            </div>
          </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="users-table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-muted-foreground">
                          Loading users...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50" data-testid="user-row">
                          <td className="p-4" data-testid="user-email">{user.email}</td>
                          <td className="p-4">{user.first_name} {user.last_name}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                              getDisplayRole(user).bgColor
                            } ${
                              getDisplayRole(user).color
                            }`}>
                              <span>{getDisplayRole(user).icon}</span>
                              {getDisplayRole(user).label}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.is_active 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="hover:bg-white/50 text-slate-600 hover:text-purple-600 transition-all duration-300" onClick={() => handleViewUser(user)} data-testid="view-user-button">View</Button>
                              <Button variant="ghost" size="sm" className="hover:bg-white/50 text-slate-600 hover:text-purple-600 transition-all duration-300" onClick={() => handleEditUser(user)} data-testid="edit-user-button">Edit</Button>
                              <Button variant="ghost" size="sm" className="hover:bg-white/50 text-slate-600 hover:text-purple-600 transition-all duration-300" onClick={() => handleToggleUserStatus(user)} data-testid="suspend-user-button">
                                {user.is_active ? 'Suspend' : 'Activate'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4" data-testid="pagination">
                <p className="text-sm text-muted-foreground">
                  Showing {users.length} users
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" disabled>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">ID:</Label>
                <span className="col-span-3">{selectedUser.id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Email:</Label>
                <span className="col-span-3">{selectedUser.email}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">First Name:</Label>
                <span className="col-span-3">{selectedUser.first_name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Last Name:</Label>
                <span className="col-span-3">{selectedUser.last_name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">User Type:</Label>
                <span className={`col-span-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium w-fit ${
                  getDisplayRole(selectedUser).bgColor
                } ${
                  getDisplayRole(selectedUser).color
                }`}>
                  <span className="text-lg">{getDisplayRole(selectedUser).icon}</span>
                  {getDisplayRole(selectedUser).label}
                  {!selectedUser.user_type && (
                    <span className="text-xs opacity-75">(Auto-identified)</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Status:</Label>
                <span className={`col-span-3 px-2 py-1 rounded-full text-xs inline-block w-fit ${
                  selectedUser.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Created:</Label>
                <span className="col-span-3">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform. They will receive an email with password reset instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={createFormData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                className="col-span-3"
                placeholder="user@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">
                First Name *
              </Label>
              <Input
                id="first_name"
                value={createFormData.first_name}
                onChange={(e) => handleFormChange('first_name', e.target.value)}
                className="col-span-3"
                placeholder="John"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">
                Last Name *
              </Label>
              <Input
                id="last_name"
                value={createFormData.last_name}
                onChange={(e) => handleFormChange('last_name', e.target.value)}
                className="col-span-3"
                placeholder="Doe"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user_type" className="text-right">
                User Type *
              </Label>
              <Select value={createFormData.user_type} onValueChange={(value) => handleFormChange('user_type', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Customer</SelectItem>
                  <SelectItem value="2">Merchant</SelectItem>
                  <SelectItem value="1">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={createFormData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                className="col-span-3"
                placeholder="Leave empty for auto-generated"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white"
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_email" className="text-right">
                Email *
              </Label>
              <Input
                id="edit_email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_first_name" className="text-right">
                First Name *
              </Label>
              <Input
                id="edit_first_name"
                value={editFormData.first_name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_last_name" className="text-right">
                Last Name *
              </Label>
              <Input
                id="edit_last_name"
                value={editFormData.last_name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_user_type" className="text-right">
                User Type *
              </Label>
              <Select value={editFormData.user_type} onValueChange={(value) => setEditFormData(prev => ({ ...prev, user_type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Customer</SelectItem>
                  <SelectItem value="2">Merchant</SelectItem>
                  <SelectItem value="1">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm(`Are you sure you want to permanently delete user "${selectedUser?.email}"? This action cannot be undone.`)) {
                  if (selectedUser) {
                    deleteUserMutation.mutate(selectedUser.id)
                  }
                }
              }}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editFormData.email || !editFormData.first_name || !editFormData.last_name || !editFormData.user_type) {
                    toast.error('Please fill in all required fields')
                    return
                  }
                  if (selectedUser) {
                    updateUserMutation.mutate({ userId: selectedUser.id, userData: editFormData })
                  }
                }}
                disabled={updateUserMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white"
              >
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
