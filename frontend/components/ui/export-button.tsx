import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { downloadBlob } from '@/lib/utils/export'

type ExportButtonProps = {
  onExport: (format: 'csv' | 'json' | 'excel') => Promise<Blob>
  filename: string
  disabled?: boolean
}

export function ExportButton({ onExport, filename, disabled }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    setIsLoading(true)
    try {
      const blob = await onExport(format)
      downloadBlob(blob, `${filename}.${format}`)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isLoading}>
          {isLoading ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
