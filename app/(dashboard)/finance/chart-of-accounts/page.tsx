'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Archive } from 'lucide-react'
import { useState } from 'react'

interface Account {
  id: string
  code: string
  name: string
  type: string
  balance: number
  status: 'active' | 'inactive'
}

const mockAccounts: Account[] = [
  { id: '1', code: '1110', name: 'Petty Cash', type: 'Asset', balance: 45000, status: 'active' },
  { id: '2', code: '1112', name: 'Bank — HBL Current', type: 'Asset', balance: 2500000, status: 'active' },
  { id: '3', code: '1121', name: 'Trade Debtors', type: 'Asset', balance: 850000, status: 'active' },
  { id: '4', code: '1130', name: 'Inventory', type: 'Asset', balance: 1200000, status: 'active' },
  { id: '5', code: '2111', name: 'Trade Creditors', type: 'Liability', balance: -450000, status: 'active' },
  { id: '6', code: '2121', name: 'Sales Tax Payable', type: 'Liability', balance: -180000, status: 'active' },
  { id: '7', code: '3100', name: 'Share Capital', type: 'Equity', balance: -5000000, status: 'active' },
  { id: '8', code: '4110', name: 'Product Sales', type: 'Revenue', balance: -2400000, status: 'active' },
]

const columns = [
  {
    key: 'code' as const,
    label: 'Code',
    sortable: true,
  },
  {
    key: 'name' as const,
    label: 'Account Name',
    sortable: true,
  },
  {
    key: 'type' as const,
    label: 'Type',
    sortable: true,
  },
  {
    key: 'balance' as const,
    label: 'Balance',
    sortable: true,
    render: (value: number) => {
      const formatted = new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(value)
      return (
        <span className={value < 0 ? 'text-red-600' : 'text-green-600'}>
          {formatted}
        </span>
      )
    },
  },
  {
    key: 'status' as const,
    label: 'Status',
    render: (value: string) => (
      <motion.span
        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
          value === 'active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-700'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300 dark:border-gray-700'
        }`}
        whileHover={{ scale: 1.05 }}
      >
        {value}
      </motion.span>
    ),
  },
]

export default function ChartOfAccountsPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chart of Accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your general ledger accounts</p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:shadow-lg transition-shadow border border-black/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Account
        </motion.button>
      </motion.div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-black/20 dark:border-black/40 rounded-lg p-3 shadow-md"
        >
          <h3 className="text-base font-semibold text-foreground mb-3">Add New Account</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Account Code"
              className="px-3 py-1.5 border border-black/15 dark:border-black/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Account Name"
              className="px-3 py-1.5 border border-black/15 dark:border-black/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select className="px-3 py-1.5 border border-black/15 dark:border-black/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Asset</option>
              <option>Liability</option>
              <option>Equity</option>
              <option>Revenue</option>
              <option>Expense</option>
            </select>
            <input
              type="number"
              placeholder="Opening Balance"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow">
              Save Account
            </button>
          </div>
        </motion.div>
      )}

      <DataTable
        columns={columns}
        data={mockAccounts}
        title="All Accounts"
        actions={(row) => (
          <>
            <motion.button
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit className="w-4 h-4" />
            </motion.button>
            <motion.button
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Archive className="w-4 h-4" />
            </motion.button>
          </>
        )}
      />
    </div>
  )
}
