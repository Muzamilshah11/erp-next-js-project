'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, FileText, Download, Send } from 'lucide-react'
import { useState } from 'react'

interface Invoice {
  id: string
  invoiceNo: string
  customer: string
  date: string
  dueDate: string
  amount: number
  paid: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNo: 'INV-2025-001',
    customer: 'ABC Trading Co.',
    date: '2025-01-10',
    dueDate: '2025-02-10',
    amount: 250000,
    paid: 250000,
    status: 'paid',
  },
  {
    id: '2',
    invoiceNo: 'INV-2025-002',
    customer: 'XYZ Enterprises',
    date: '2025-01-15',
    dueDate: '2025-02-15',
    amount: 180000,
    paid: 0,
    status: 'sent',
  },
  {
    id: '3',
    invoiceNo: 'INV-2025-003',
    customer: 'Tech Solutions Ltd.',
    date: '2025-01-12',
    dueDate: '2025-02-12',
    amount: 95000,
    paid: 0,
    status: 'overdue',
  },
  {
    id: '4',
    invoiceNo: 'INV-2025-004',
    customer: 'Global Imports',
    date: '2025-01-18',
    dueDate: '2025-02-18',
    amount: 450000,
    paid: 150000,
    status: 'sent',
  },
  {
    id: '5',
    invoiceNo: 'INV-2025-005',
    customer: 'Retail Plus',
    date: '2025-01-20',
    dueDate: '2025-02-20',
    amount: 75000,
    paid: 0,
    status: 'draft',
  },
]

const columns = [
  {
    key: 'invoiceNo' as const,
    label: 'Invoice #',
    sortable: true,
    render: (value: string) => (
      <motion.div className="flex items-center gap-2" whileHover={{ x: 4 }}>
        <FileText className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground">{value}</span>
      </motion.div>
    ),
  },
  {
    key: 'customer' as const,
    label: 'Customer',
    sortable: true,
  },
  {
    key: 'date' as const,
    label: 'Invoice Date',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
  },
  {
    key: 'dueDate' as const,
    label: 'Due Date',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
  },
  {
    key: 'amount' as const,
    label: 'Amount',
    sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(value),
  },
  {
    key: 'paid' as const,
    label: 'Paid',
    sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(value),
  },
  {
    key: 'status' as const,
    label: 'Status',
    render: (value: string) => {
      const statusConfig = {
        draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
        sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        paid: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        overdue: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      }
      return (
        <motion.span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[value as keyof typeof statusConfig]}`}
          whileHover={{ scale: 1.05 }}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </motion.span>
      )
    },
  },
]

export default function InvoicesPage() {
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
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Create and manage sales invoices</p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </motion.button>
      </motion.div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Create New Invoice</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <select className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Select Customer</option>
                <option>ABC Trading Co.</option>
                <option>XYZ Enterprises</option>
              </select>
              <input
                type="date"
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="bg-secondary/30 p-4 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-3">Invoice Items</p>
              <div className="space-y-2">
                {[0].map(i => (
                  <div key={i} className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Description"
                      className="col-span-2 px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      className="px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Price"
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
                Create Invoice
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <DataTable
        columns={columns}
        data={mockInvoices}
        title="Sales Invoices"
        actions={(row) => (
          <>
            <motion.button
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </motion.button>
            {row.status === 'draft' && (
              <motion.button
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Send"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            )}
          </>
        )}
      />
    </div>
  )
}
