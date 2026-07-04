'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Package, Trash2, Pencil, Loader2, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface DeliveryNoteItem {
  description: string
  quantity: number
  price: number
}

interface DeliveryNote {
  id: string
  dnNo: string
  customer: { id: string; name: string }
  customerId: string
  invoice?: { id: string; invoiceNo: string } | null
  order?: { id: string; orderNo: string } | null
  date: string
  status: string
  items: DeliveryNoteItem[]
}

const statusConfig: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
  packed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
}

const columns = [
  { key: 'dnNo' as const, label: 'DN #', sortable: true,
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-primary shrink-0" />
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
  { key: 'invoice' as const, label: 'Invoice',
    render: (value: { invoiceNo: string } | null | undefined) => value?.invoiceNo || '-',
  },
  { key: 'order' as const, label: 'Order',
    render: (value: { orderNo: string } | null | undefined) => value?.orderNo || '-',
  },
  { key: 'status' as const, label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[value] || statusConfig.draft}`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    ),
  },
]

export default function DeliveryNotesPage() {
  const [notes, setNotes] = useState<DeliveryNote[]>([])
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DeliveryNote | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customerId: '', date: '', invoiceId: '', orderId: '',
    items: [] as { description: string; quantity: number; price: number }[],
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dRes, cRes] = await Promise.all([
        fetch('/api/sales/delivery-notes'),
        fetch('/api/sales/customers'),
      ])
      const dData = await dRes.json()
      const cData = await cRes.json()
      if (!dRes.ok) throw new Error(dData.error)
      setNotes(dData.deliveryNotes || [])
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
    setForm({
      customerId: '', date: new Date().toISOString().slice(0, 10),
      invoiceId: '', orderId: '', items: [],
    })
    setShowForm(true)
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, price: 0 }] })
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        customerId: form.customerId,
        date: form.date,
        invoiceId: form.invoiceId || null,
        orderId: form.orderId || null,
        items: form.items.filter(i => i.description),
      }
      const url = editing ? `/api/sales/delivery-notes/${editing.id}` : '/api/sales/delivery-notes'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false)
      setEditing(null)
      fetchData()
    } catch {
      setError('Failed to save delivery note')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this delivery note?')) return
    try {
      const res = await fetch(`/api/sales/delivery-notes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      fetchData()
    } catch {
      setError('Failed to delete')
    }
  }

  const handleStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/sales/delivery-notes/${id}`, {
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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            Delivery Notes
          </h1>
          <p className="text-muted-foreground mt-1">Track deliveries and shipments</p>
        </div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> New Delivery Note
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
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Delivery Note' : 'New Delivery Note'}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                Date:
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary flex-1" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm">
                Invoice (optional):
                <input type="text" value={form.invoiceId} onChange={e => setForm({ ...form, invoiceId: e.target.value })} placeholder="Invoice ID" className="px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary flex-1 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                Order (optional):
                <input type="text" value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })} placeholder="Order ID" className="px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary flex-1 text-sm" />
              </label>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Items</h4>
                <button type="button" onClick={addItem} className="text-xs text-primary hover:underline">+ Add Item</button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" placeholder="Description" value={item.description} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], description: e.target.value }; setForm({ ...form, items }) }} className="flex-1 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], quantity: parseInt(e.target.value) || 0 }; setForm({ ...form, items }) }} className="w-20 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input type="number" placeholder="Price" value={item.price} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], price: parseFloat(e.target.value) || 0 }; setForm({ ...form, items }) }} className="w-28 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <button type="button" onClick={() => { setForm({ ...form, items: form.items.filter((_, i) => i !== idx) }) }} className="p-1 text-muted-foreground hover:text-destructive"><XCircle className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end border-t border-border pt-4">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading delivery notes...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={notes}
          title="Delivery Notes"
          actions={(row) => (
            <div className="flex items-center gap-1">
              {row.status === 'draft' && (
                <motion.button onClick={() => handleStatus(row.id, 'packed')} className="p-2 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Mark Packed">
                  <Package className="w-4 h-4" />
                </motion.button>
              )}
              {row.status === 'packed' && (
                <motion.button onClick={() => handleStatus(row.id, 'shipped')} className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Mark Shipped">
                  <Package className="w-4 h-4" />
                </motion.button>
              )}
              {row.status === 'shipped' && (
                <motion.button onClick={() => handleStatus(row.id, 'delivered')} className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Mark Delivered">
                  <Package className="w-4 h-4" />
                </motion.button>
              )}
              <motion.button onClick={() => setEditing(row as unknown as DeliveryNote)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Edit">
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