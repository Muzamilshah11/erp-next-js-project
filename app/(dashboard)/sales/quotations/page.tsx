'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, FileText, Send, Trash2, Pencil, Loader2, ArrowRight, Check, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface QuotationItem {
  description: string
  quantity: number
  price: number
}

interface Quotation {
  id: string
  quoteNo: string
  customer: { id: string; name: string }
  customerId: string
  date: string
  validUntil: string
  amount: number
  status: string
  items: QuotationItem[]
}

const statusConfig: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
}

const columns = [
  { key: 'quoteNo' as const, label: 'Quote #', sortable: true,
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <span className="font-semibold">{value}</span>
      </div>
    ),
  },
  { key: 'customer' as const, label: 'Customer', sortable: true,
    render: (value: { name: string }) => value?.name || 'Unknown',
  },
  { key: 'date' as const, label: 'Date', sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
  },
  { key: 'validUntil' as const, label: 'Valid Until',
    render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
  },
  { key: 'amount' as const, label: 'Amount', sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(value),
  },
  { key: 'status' as const, label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[value] || statusConfig.draft}`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    ),
  },
]

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Quotation | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customerId: '', date: '', validUntil: '', amount: '', status: 'draft',
    items: [] as { description: string; quantity: number; price: number }[],
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [qRes, cRes] = await Promise.all([
        fetch('/api/sales/quotations'),
        fetch('/api/sales/customers'),
      ])
      const qData = await qRes.json()
      const cData = await cRes.json()
      if (!qRes.ok) throw new Error(qData.error)
      setQuotations(qData.quotations || [])
      setCustomers(cData.customers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ customerId: '', date: '', validUntil: '', amount: '', status: 'draft', items: [] })
    setShowForm(true)
  }

  const openEdit = (q: Quotation) => {
    setEditing(q)
    setForm({
      customerId: q.customerId,
      date: q.date.slice(0, 10),
      validUntil: q.validUntil.slice(0, 10),
      amount: String(q.amount),
      status: q.status,
      items: q.items || [],
    })
    setShowForm(true)
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, price: 0 }] })
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
  const updateItem = (idx: number, field: string, value: string | number) => {
    const items = [...form.items]
    items[idx] = { ...items[idx], [field]: value }
    const total = items.reduce((s, it) => s + it.quantity * it.price, 0)
    setForm({ ...form, items, amount: String(total) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        customerId: form.customerId,
        date: form.date,
        validUntil: form.validUntil,
        amount: parseFloat(form.amount) || 0,
        status: editing ? form.status : 'draft',
        items: form.items.filter(i => i.description),
      }
      const url = editing ? `/api/sales/quotations/${editing.id}` : '/api/sales/quotations'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false)
      setEditing(null)
      fetchData()
    } catch {
      setError('Failed to save quotation')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this quotation?')) return
    try {
      const res = await fetch(`/api/sales/quotations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      fetchData()
    } catch {
      setError('Failed to delete')
    }
  }

  const handleStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/sales/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      fetchData()
    } catch {
      setError('Failed to update status')
    }
  }

  const handleConvertToOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/sales/quotations/${id}/convert-to-order`, { method: 'POST' })
      if (!res.ok) throw new Error()
      fetchData()
    } catch {
      setError('Failed to convert to order')
    }
  }

  const curr = (v: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Quotations
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage sales quotations</p>
        </div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> New Quotation
        </motion.button>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Quotation' : 'New Quotation'}</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                Date:
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary flex-1" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                Valid Until:
                <input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} required className="px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary flex-1" />
              </label>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Line Items</h4>
                <button type="button" onClick={addItem} className="text-xs text-primary hover:underline">+ Add Item</button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="flex-1 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="w-20 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input type="number" placeholder="Price" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} className="w-28 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <span className="text-sm font-medium w-24 text-right">{curr(item.quantity * item.price)}</span>
                  <button type="button" onClick={() => removeItem(idx)} className="p-1 text-muted-foreground hover:text-destructive"><XCircle className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-lg font-bold">Total: {curr(parseFloat(form.amount) || 0)}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quotations...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={quotations}
          title="Sales Quotations"
          actions={(row) => (
            <div className="flex items-center gap-1">
              {row.status === 'draft' && (
                <motion.button onClick={() => handleStatus(row.id, 'sent')} className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Send">
                  <Send className="w-4 h-4" />
                </motion.button>
              )}
              {row.status === 'sent' && (
                <>
                  <motion.button onClick={() => handleStatus(row.id, 'accepted')} className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Accept">
                    <Check className="w-4 h-4" />
                  </motion.button>
                  <motion.button onClick={() => handleStatus(row.id, 'rejected')} className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Reject">
                    <XCircle className="w-4 h-4" />
                  </motion.button>
                </>
              )}
              {row.status === 'accepted' && (
                <motion.button onClick={() => handleConvertToOrder(row.id)} className="p-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Convert to Order">
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
              <motion.button onClick={() => openEdit(row as unknown as Quotation)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Edit">
                <Pencil className="w-4 h-4" />
              </motion.button>
              <motion.button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete">
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        />
      )}
    </div>
  )
}