'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Menu,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
  Settings2,
  Globe,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import {
  getUSSDMenus,
  getUSSDMenuTypes,
  createUSSDMenu,
  updateUSSDMenu,
  deleteUSSDMenu,
  type USSDMenu,
  type USSDMenuOption,
  type USSDMenuType,
  type USSDMenuCreateData
} from '@/lib/api/ussd'
import { useToast } from '@/hooks/use-toast'

interface MenuOptionEditorProps {
  options: USSDMenuOption[]
  onChange: (options: USSDMenuOption[]) => void
}

function MenuOptionEditor({ options, onChange }: MenuOptionEditorProps) {
  const addOption = () => {
    onChange([...options, { input: '', text: '', action: '' }])
  }

  const updateOption = (index: number, field: keyof USSDMenuOption, value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    onChange(newOptions)
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Menu Options</Label>
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="h-4 w-4 mr-1" />
          Add Option
        </Button>
      </div>
      
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">No options added yet. Click "Add Option" to create menu options.</p>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30">
              <div className="flex-shrink-0 w-16">
                <Label className="text-xs">Input</Label>
                <Input
                  placeholder="1"
                  value={option.input}
                  onChange={(e) => updateOption(index, 'input', e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Text</Label>
                <Input
                  placeholder="Option text"
                  value={option.text}
                  onChange={(e) => updateOption(index, 'text', e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Action (optional)</Label>
                <Input
                  placeholder="next_menu"
                  value={option.action || ''}
                  onChange={(e) => updateOption(index, 'action', e.target.value)}
                  className="h-8"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5 h-8 w-8 text-destructive"
                onClick={() => removeOption(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface MenuFormData {
  menu_id: string
  menu_type: string
  title: string
  content: string
  options: USSDMenuOption[]
  language: string
  is_default: boolean
  timeout_seconds: number
  is_active: boolean
}

const defaultFormData: MenuFormData = {
  menu_id: '',
  menu_type: 'main',
  title: '',
  content: '',
  options: [],
  language: 'en',
  is_default: false,
  timeout_seconds: 60,
  is_active: true
}

export default function USSDMenuManager() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<USSDMenu | null>(null)
  const [menuToDelete, setMenuToDelete] = useState<USSDMenu | null>(null)
  const [formData, setFormData] = useState<MenuFormData>(defaultFormData)
  const [filterType, setFilterType] = useState<string>('all')

  // Fetch menus
  const { data: menusData, isLoading: menusLoading } = useQuery({
    queryKey: ['ussd-menus', filterType],
    queryFn: () => getUSSDMenus(filterType !== 'all' ? { menu_type: filterType } : undefined)
  })

  // Fetch menu types
  const { data: menuTypes } = useQuery({
    queryKey: ['ussd-menu-types'],
    queryFn: getUSSDMenuTypes
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createUSSDMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ussd-menus'] })
      toast({ title: 'Success', description: 'Menu created successfully' })
      closeDialog()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create menu',
        variant: 'destructive'
      })
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<USSDMenuCreateData> }) =>
      updateUSSDMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ussd-menus'] })
      toast({ title: 'Success', description: 'Menu updated successfully' })
      closeDialog()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update menu',
        variant: 'destructive'
      })
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUSSDMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ussd-menus'] })
      toast({ title: 'Success', description: 'Menu deleted successfully' })
      setIsDeleteDialogOpen(false)
      setMenuToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete menu',
        variant: 'destructive'
      })
    }
  })

  const openCreateDialog = () => {
    setEditingMenu(null)
    setFormData(defaultFormData)
    setIsDialogOpen(true)
  }

  const openEditDialog = (menu: USSDMenu) => {
    setEditingMenu(menu)
    setFormData({
      menu_id: menu.menu_id,
      menu_type: menu.menu_type,
      title: menu.title,
      content: menu.content,
      options: menu.options || [],
      language: menu.language,
      is_default: menu.is_default,
      timeout_seconds: menu.timeout_seconds,
      is_active: menu.is_active
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingMenu(null)
    setFormData(defaultFormData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.menu_id || !formData.title || !formData.content) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    const submitData: USSDMenuCreateData = {
      menu_id: formData.menu_id,
      menu_type: formData.menu_type,
      title: formData.title,
      content: formData.content,
      options: formData.options,
      language: formData.language,
      is_default: formData.is_default,
      timeout_seconds: formData.timeout_seconds,
      is_active: formData.is_active
    }

    if (editingMenu) {
      updateMutation.mutate({ id: editingMenu.id, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const confirmDelete = (menu: USSDMenu) => {
    setMenuToDelete(menu)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (menuToDelete) {
      deleteMutation.mutate(menuToDelete.id)
    }
  }

  const getMenuTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      main: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      payment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      balance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      transfer: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      bill_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      airtime: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      registration: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      settings: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            USSD Menu Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage USSD menu structure and options
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {menuTypes?.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu List */}
      <Card>
        <CardContent className="p-0">
          {menusLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : menusData?.results && menusData.results.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menusData.results.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell className="font-mono text-sm">{menu.menu_id}</TableCell>
                    <TableCell>
                      <Badge className={getMenuTypeBadgeColor(menu.menu_type)}>
                        {menu.menu_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Menu className="h-4 w-4 text-muted-foreground" />
                        {menu.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {menu.language.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {menu.options?.length || 0} options
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {menu.is_active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(menu)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => confirmDelete(menu)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <Menu className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No USSD menus found</p>
              <p className="text-muted-foreground mt-1">
                Create your first menu to get started
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Menu
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? 'Edit Menu' : 'Create New Menu'}
            </DialogTitle>
            <DialogDescription>
              {editingMenu
                ? 'Update the USSD menu configuration'
                : 'Configure a new USSD menu with options'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="menu_id">Menu ID *</Label>
                <Input
                  id="menu_id"
                  placeholder="main_menu"
                  value={formData.menu_id}
                  onChange={(e) => setFormData({ ...formData, menu_id: e.target.value })}
                  disabled={!!editingMenu}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu_type">Menu Type *</Label>
                <Select
                  value={formData.menu_type}
                  onValueChange={(value) => setFormData({ ...formData, menu_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {menuTypes?.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Main Menu"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content/Body Text *</Label>
              <Textarea
                id="content"
                placeholder="Welcome to SikaRemit. Please select an option:"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={3}
              />
            </div>

            <MenuOptionEditor
              options={formData.options}
              onChange={(options) => setFormData({ ...formData, options })}
            />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="tw">Twi</SelectItem>
                    <SelectItem value="ha">Hausa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min={10}
                  max={300}
                  value={formData.timeout_seconds}
                  onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label className="font-normal">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label className="font-normal">Set as default menu for this type</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMenu ? 'Update Menu' : 'Create Menu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the menu "{menuToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
