'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Phone, Mail, MapPin, Trash2, Search, Pencil, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  totalSales: number
  balance: number
  status: 'active' | 'inactive'
}

const columns = [
  {
    key: 'name' as const,
    label: 'Customer Name',
    sortable: true,
  },
  {
    key: 'email' as const,
    label: 'Email',
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="truncate">{value}</span>
      </div>
    ),
  },
  {
    key: 'phone' as const,
    label: 'Phone',
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
        <span>{value}</span>
      </div>
    ),
  },
  {
    key: 'city' as const,
    label: 'City',
    sortable: true,
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
        <span>{value}</span>
      </div>
    ),
  },
  {
    key: 'totalSales' as const,
    label: 'Total Sales',
    sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(value),
  },
  {
    key: 'balance' as const,
    label: 'Balance',
    sortable: true,
    render: (value: number) => (
      <span className={`font-semibold ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''}`}>
        {new Intl.NumberFormat('en-PK', {
          style: 'currency',
          currency: 'PKR',
          minimumFractionDigits: 0,
        }).format(value)}
      </span>
    ),
  },
  {
    key: 'status' as const,
    label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        value === 'active'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
      }`}>
        {value}
      </span>
    ),
  },
]

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '' })
  const [saving, setSaving] = useState(false)

  const fetchCustomers = async (q = '') => {
    setLoading(true)
    setError('')
    try {
      const url = q ? `/api/sales/customers?q=${encodeURIComponent(q)}` : '/api/sales/customers'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setCustomers(data.customers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', city: '' })
    setShowForm(true)
  }

  const openEdit = (customer: Customer) => {
    setEditing(customer)
    setForm({ name: customer.name, email: customer.email, phone: customer.phone, city: customer.city })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing ? `/api/sales/customers/${editing.id}` : '/api/sales/customers'
      const method = editing ? 'PUT' : 'POST'
      const body = editing
        ? JSON.stringify(form)
        : JSON.stringify({ ...form, totalSales: 0, balance: 0, status: 'active' })

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false)
      setEditing(null)
      setForm({ name: '', email: '', phone: '', city: '' })
      fetchCustomers(search)
    } catch {
      setError('Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this customer?')) return
    try {
      const res = await fetch(`/api/sales/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchCustomers(search)
    } catch {
      setError('Failed to delete customer')
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
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer relationships</p>
        </div>
        <motion.button
          onClick={openNew}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          New Customer
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-sm"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </motion.div>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {editing ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Company Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <input type="text" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          title="All Customers"
          actions={(row) => (
            <div className="flex items-center gap-1">
              <motion.button
                onClick={() => openEdit(row as Customer)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => handleDelete(row.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        />
      )}
    </div>
  )
}