'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type HeaderGroup,
  type Row,
  type Cell,
} from '@tanstack/react-table'
import cn from 'classnames'
import { useState, useEffect } from 'react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  className?: string
  'aria-label'?: string
  tabIndex?: number
  mobileCardView?: boolean
  mobileCardRenderer?: (row: TData) => React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  'aria-label': ariaLabel,
  tabIndex,
  mobileCardView,
  mobileCardRenderer,
  ...props
}: DataTableProps<TData, TValue>) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // For mobile card view, filter out select columns and actions columns
  const cardColumns = React.useMemo(() => {
    return columns.filter(col => 
      col.id !== 'select' && col.id !== 'actions' && 
      (col as any).accessorKey !== 'select' && (col as any).accessorKey !== 'actions'
    )
  }, [columns])

  if (isMobile && mobileCardView) {
    return (
      <div className={cn('space-y-4', className)} aria-label={ariaLabel} tabIndex={tabIndex} {...props}>
        {table.getRowModel().rows.map((row: Row<TData>) => (
          <div key={row.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
            {cardColumns.map((column, index) => {
              const cell = row.getVisibleCells().find(c => c.column.id === column.id)
              if (!cell) return null
              
              const header = typeof column.header === 'string' ? column.header : column.id
              
              return (
                <div key={column.id} className={cn("flex justify-between items-center py-2", index > 0 && "border-t border-border")}>
                  <span className="text-sm font-medium text-muted-foreground capitalize">
                    {header}:
                  </span>
                  <span className="text-sm text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              )
            })}
            {/* Actions section */}
            {columns.find(col => col.id === 'actions') && (
              <div className="flex justify-end pt-2 border-t border-border">
                {table.getRowModel().rows.map((actionRow) => {
                  if (actionRow.id !== row.id) return null
                  const actionCell = actionRow.getVisibleCells().find(c => c.column.id === 'actions')
                  return actionCell ? (
                    <div key="actions">
                      {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div 
      className={cn('rounded-md border overflow-x-auto', className)}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      {...props}
    >
      <table className="w-full min-w-[600px]">
        <thead>
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row: Row<TData>) => (
            <tr key={row.id} className="border-t border-border hover:bg-muted/50">
              {row.getVisibleCells().map((cell: Cell<TData, TValue>) => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
