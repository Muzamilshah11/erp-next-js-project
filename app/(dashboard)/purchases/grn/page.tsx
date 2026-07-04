'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Archive, Trash2, Pencil, Loader2, XCircle, Check } from 'lucide-react'
import { useState, useEffect } from 'react'

interface GRNItem { description: string; quantity: number; price: number }
interface GRN {
  id: string; grnNo: string
  supplier: { id: string; name: string }
  supplierId: string
  po?: { id: string; poNo: string } | null
  poId?: string | null
  date: string; status: string
  items: GRNItem[]
}

const statusConfig: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
  received: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
}

const columns = [
  { key: 'grnNo' as const, label: 'GRN #', sortable: true,
    render: (value: string) => (
      <div className="flex items-center gap-2"><Archive className="w-4 h-4 text-primary shrink-0" /><span className="font-semibold">{value}</span></div>
    ),
  },
  { key: 'supplier' as const, label: 'Supplier', sortable: true,
    render: (value: { name: string }) => value?.name || 'Unknown',
  },
  { key: 'po' as const, label: 'PO',
    render: (value: { poNo: string } | null | undefined) => value?.poNo || '-',
  },
  { key: 'date' as const, label: 'Date', sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
  },
  { key: 'status' as const, label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[value] || statusConfig.draft}`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    ),
  },
]

export default function GRNPage() {
  const [grns, setGrns] = useState<GRN[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [pos, setPos] = useState<{ id: string; poNo: string }[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<GRN | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ supplierId: '', poId: '', date: '', items: [] as { description: string; quantity: number; price: number }[] })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [gRes, sRes, pRes] = await Promise.all([
        fetch('/api/purchases/grn'),
        fetch('/api/purchases/suppliers'),
        fetch('/api/purchases/orders'),
      ])
      const gData = await gRes.json(); const sData = await sRes.json(); const pData = await pRes.json()
      if (!gRes.ok) throw new Error(gData.error)
      setGrns(gData.grns || []); setSuppliers(sData.suppliers || []); setPos(pData.orders?.map((o: { id: string; poNo: string }) => ({ id: o.id, poNo: o.poNo })) || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openNew = () => { setEditing(null); setForm({ supplierId: '', poId: '', date: new Date().toISOString().slice(0, 10), items: [] }); setShowForm(true) }

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, price: 0 }] })
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const body = { supplierId: form.supplierId, poId: form.poId || null, date: form.date, status: 'received', items: form.items.filter(i => i.description) }
      const url = editing ? `/api/purchases/grn/${editing.id}` : '/api/purchases/grn'
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false); setEditing(null); fetchData()
    } catch { setError('Failed to save') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this GRN?')) return
    try { const res = await fetch(`/api/purchases/grn/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); fetchData() } catch { setError('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Archive className="w-8 h-8 text-primary" /> Goods Received Notes</h1>
          <p className="text-muted-foreground mt-1">Track goods received from suppliers</p>
        </div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> New GRN
        </motion.button>
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">New Goods Received Note</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={form.poId} onChange={e => setForm({ ...form, poId: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">No PO (optional)</option>
                {pos.map(p => <option key={p.id} value={p.id}>{p.poNo}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">Date: <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary flex-1" /></label>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-foreground">Items Received</h4><button type="button" onClick={addItem} className="text-xs text-primary hover:underline">+ Add Item</button></div>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" placeholder="Description" value={item.description} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], description: e.target.value }; setForm({ ...form, items }) }} className="flex-1 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], quantity: parseInt(e.target.value) || 0 }; setForm({ ...form, items }) }} className="w-20 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input type="number" placeholder="Price" value={item.price} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], price: parseFloat(e.target.value) || 0 }; setForm({ ...form, items }) }} className="w-28 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <button type="button" onClick={() => removeItem(idx)} className="p-1 text-muted-foreground hover:text-destructive"><XCircle className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end border-t border-border pt-4">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Receive Goods</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading GRNs...</p></div>
      ) : (
        <DataTable columns={columns} data={grns} title="Goods Received Notes"
          actions={(row) => (
            <div className="flex items-center gap-1">
              {row.status === 'draft' && <button onClick={() => { /* mark received via PUT */ }} className="p-2 text-muted-foreground hover:text-green-600 rounded-lg" title="Receive"><Check className="w-4 h-4" /></button>}
              <motion.button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
            </div>
          )}
        />
      )}
    </div>
  )
}