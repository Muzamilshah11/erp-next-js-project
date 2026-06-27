'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface JournalEntry {
  id: string
  entryNo: string
  date: string
  description: string
  debit: number
  credit: number
  status: 'posted' | 'draft'
}

const mockEntries: JournalEntry[] = [
  {
    id: '1',
    entryNo: 'JE-2025-000001',
    date: '2025-01-15',
    description: 'Sales Invoice #INV001 - Customer A',
    debit: 118000,
    credit: 0,
    status: 'posted',
  },
  {
    id: '2',
    entryNo: 'JE-2025-000002',
    date: '2025-01-16',
    description: 'Bank Receipt - Payment from Customer A',
    debit: 0,
    credit: 118000,
    status: 'posted',
  },
  {
    id: '3',
    entryNo: 'JE-2025-000003',
    date: '2025-01-17',
    description: 'Purchase Order #PO001 - Supplier B',
    debit: 85000,
    credit: 0,
    status: 'draft',
  },
  {
    id: '4',
    entryNo: 'JE-2025-000004',
    date: '2025-01-18',
    description: 'Depreciation Expense - Equipment',
    debit: 5000,
    credit: 0,
    status: 'posted',
  },
  {
    id: '5',
    entryNo: 'JE-2025-000005',
    date: '2025-01-19',
    description: 'GST Filing - Monthly Tax Payment',
    debit: 0,
    credit: 45000,
    status: 'posted',
  },
]

const columns = [
  {
    key: 'entryNo' as const,
    label: 'Entry No.',
    sortable: true,
  },
  {
    key: 'date' as const,
    label: 'Date',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
  },
  {
    key: 'description' as const,
    label: 'Description',
    sortable: true,
  },
  {
    key: 'debit' as const,
    label: 'Debit',
    sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
      }).format(value),
  },
  {
    key: 'credit' as const,
    label: 'Credit',
    sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
      }).format(value),
  },
  {
    key: 'status' as const,
    label: 'Status',
    render: (value: string) => (
      <motion.span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === 'posted'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
        }`}
        whileHover={{ scale: 1.05 }}
      >
        {value}
      </motion.span>
    ),
  },
]

export default function JournalEntriesPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Journal Entries</h1>
          <p className="text-muted-foreground mt-1">Record and manage journal entries</p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          New Entry
        </motion.button>
      </motion.div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Create Journal Entry</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Reference (e.g. INV001)"
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <textarea
              placeholder="Description"
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
            />
            <div className="bg-secondary/30 p-4 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-3">Journal Lines</p>
              <div className="space-y-2">
                {[0, 1].map(i => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <select className="px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Select Account</option>
                      <option>1110 - Petty Cash</option>
                      <option>1121 - Trade Debtors</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Debit"
                      className="px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Credit"
                      className="px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow">
                Post Entry
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <DataTable
        columns={columns}
        data={mockEntries}
        title="Journal Entries"
        actions={(row) => (
          <>
            <motion.button
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-4 h-4" />
            </motion.button>
            {row.status === 'draft' && (
              <motion.button
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </>
        )}
      />
    </div>
  )
}
