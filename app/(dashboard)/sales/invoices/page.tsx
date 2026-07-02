'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, FileText, Download, Send, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'

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
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customerId: '', date: '', dueDate: '', amount: '', description: '' })

  const fetchInvoices = async () => {
    const res = await fetch('/api/sales/invoices')
    const data = await res.json()
    setInvoices(data.invoices.map((inv: { customer: { name: string }; date: string; dueDate: string; items: unknown[]; id: string; invoiceNo: string; amount: number; paid: number; status: string }) => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      customer: inv.customer?.name || 'Unknown',
      date: inv.date,
      dueDate: inv.dueDate,
      amount: inv.amount,
      paid: inv.paid,
      status: inv.status,
    })))
  }

  useEffect(() => { fetchInvoices() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/sales/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: form.customerId,
        date: form.date,
        dueDate: form.dueDate,
        amount: parseFloat(form.amount) || 0,
        status: 'draft',
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ customerId: '', date: '', dueDate: '', amount: '', description: '' })
      fetchInvoices()
    }
  }

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
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Create New Invoice</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Customer ID"
                value={form.customerId}
                onChange={e => setForm({ ...form, customerId: e.target.value })}
                required
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                required
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow">
                Create Invoice
              </button>
            </div>
          </div>
        </motion.form>
      )}

      <DataTable
        columns={columns}
        data={invoices}
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
                onClick={async () => {
                  await fetch(`/api/sales/invoices/${row.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'sent' }),
                  })
                  fetchInvoices()
                }}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Send"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            )}
            <motion.button
              onClick={async () => {
                if (window.confirm('Delete this invoice?')) {
                  await fetch(`/api/sales/invoices/${row.id}`, { method: 'DELETE' })
                  fetchInvoices()
                }
              }}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </>
        )}
      />
    </div>
  )
}
