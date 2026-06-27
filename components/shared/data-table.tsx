'use client'

import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  title?: string
  actions?: (row: T) => React.ReactNode
}

type SortDirection = 'asc' | 'desc' | null

export function DataTable<T extends { id: string }>({
  columns,
  data,
  title,
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortKey(null)
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0

    const aValue = a[sortKey]
    const bValue = b[sortKey]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  return (
    <motion.div
      className="bg-card rounded-lg border border-black/20 dark:border-black/40 overflow-hidden shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {title && (
        <div className="px-4 py-3 border-b border-black/10 dark:border-black/20">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/10 dark:border-black/20 bg-secondary/30 hover:bg-secondary/50 transition-colors">
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  onClick={() => column.sortable && handleSort(column.key)}
                  className={`px-4 py-2 text-left text-xs font-semibold text-foreground ${
                    column.sortable ? 'cursor-pointer hover:bg-secondary/70 transition-colors' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {sortKey === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-primary" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 text-muted-foreground opacity-50" />
                        )}
                      </motion.div>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <motion.tr
                key={row.id}
                className="border-b border-black/10 dark:border-black/20 hover:bg-secondary/30 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02, duration: 0.2 }}
                whileHover={{ backgroundColor: 'rgba(15, 23, 42, 0.05)' }}
              >
                {columns.map(column => (
                  <td
                    key={String(column.key)}
                    className="px-4 py-2 text-sm text-foreground"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key])}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {data.length === 0 && (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-muted-foreground text-sm">No data available</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
