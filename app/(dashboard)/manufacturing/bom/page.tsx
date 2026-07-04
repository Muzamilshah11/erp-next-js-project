'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Pencil, Search, X, Loader2, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface InvItem { id: string; name: string; sku: string; unitPrice: number }
interface BOMItem { id: string; item: InvItem; quantity: number; unitCost: number }
interface BOM { id: string; bomNo: string; name: string; item: InvItem; quantity: number; totalCost: number; items: BOMItem[]; _count: { items: number; workOrders: number } }

const columns = [
  { key: 'bomNo' as const, label: 'BOM No', sortable: true, render: (v: string) => <span className="font-mono font-semibold text-primary">{v}</span> },
  { key: 'item' as const, label: 'Finished Good', sortable: true, render: (v: InvItem) => <span className="font-medium">{v?.name}</span> },
  { key: 'totalCost' as const, label: 'Total Cost', sortable: true, render: (v: number) => v.toLocaleString() },
  { key: '_count' as const, label: 'Components', render: (v: { items: number }) => String(v?.items || 0) },
]

export default function BOMPage() {
  const [boms, setBoms] = useState<BOM[]>([]); const [items, setItems] = useState<InvItem[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<BOM | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', itemId: '', quantity: '1' })
  const [bomItems, setBomItems] = useState<{ itemId: string; quantity: string; unitCost: string }[]>([])

  const fetchData = async (q = '') => {
    setLoading(true); setError('')
    try {
      const url = q ? `/api/manufacturing/bom?q=${encodeURIComponent(q)}` : '/api/manufacturing/bom'
      const [bRes, iRes] = await Promise.all([fetch(url), fetch('/api/inventory/items')])
      const bData = await bRes.json(); const iData = await iRes.json()
      if (!bRes.ok) throw new Error(bData.error || 'Failed')
      setBoms(bData.boms || []); setItems(iData.items || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => { const t = setTimeout(() => fetchData(search), 300); return () => clearTimeout(t) }, [search])

  const openNew = () => { setEditing(null); setForm({ name: '', itemId: '', quantity: '1' }); setBomItems([]); setShowForm(true) }

  const addItem = () => setBomItems([...bomItems, { itemId: '', quantity: '1', unitCost: '0' }])
  const removeItem = (i: number) => setBomItems(bomItems.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string) => { const u = [...bomItems]; u[i] = { ...u[i], [field]: value }; setBomItems(u) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const body = {
        name: form.name || items.find(i => i.id === form.itemId)?.name || '',
        itemId: form.itemId, quantity: parseFloat(form.quantity) || 1,
        items: bomItems.map(it => ({ itemId: it.itemId, quantity: parseFloat(it.quantity) || 1, unitCost: parseFloat(it.unitCost) || 0 })),
      }
      const url = editing ? `/api/manufacturing/bom/${editing.id}` : '/api/manufacturing/bom'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false); setEditing(null); fetchData(search)
    } catch { setError('Failed to save BOM') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this BOM?')) return
    try { const res = await fetch(`/api/manufacturing/bom/${id}`, { method: 'DELETE' }); if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }; fetchData(search) }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete') }
  }

  const getUnitCost = (itemId: string) => {
    const it = items.find(i => i.id === itemId); return it?.unitPrice || 0
  }

  const filteredItems = items.filter(i => i.id !== form.itemId)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Bill of Materials</h1><p className="text-muted-foreground mt-1">Define product structures and components</p></div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> Create BOM
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search BOMs..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit BOM' : 'Create BOM'}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <select value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select Finished Good</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Production Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-foreground">Components</span><button type="button" onClick={addItem} className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium">+ Add Component</button></div>
              {bomItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <select value={item.itemId} onChange={e => updateItem(idx, 'itemId', e.target.value)} required className="flex-1 px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select Component</option>
                    {filteredItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku}) - {i.unitPrice}</option>)}
                  </select>
                  <input type="number" step="0.01" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required min="0.01" className="w-20 px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input type="number" step="0.01" placeholder="Unit Cost" value={item.unitCost} onChange={e => updateItem(idx, 'unitCost', e.target.value)} className="w-24 px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <span className="text-xs text-muted-foreground w-16">{(parseFloat(item.unitCost) || getUnitCost(item.itemId)).toLocaleString()}</span>
                  <button type="button" onClick={() => removeItem(idx)} className="p-2 text-muted-foreground hover:text-destructive"><XCircle className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="bg-muted/30 rounded-lg p-3 text-sm mb-4 flex justify-between items-center">
              <span className="text-muted-foreground">Total Cost per production qty ({form.quantity}):</span>
              <span className="font-bold text-lg text-primary">
                {bomItems.reduce((s, it) => s + ((parseFloat(it.unitCost) || getUnitCost(it.itemId)) * (parseFloat(it.quantity) || 1)) * (parseFloat(form.quantity) || 1), 0).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Update' : 'Create BOM'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading BOMs...</p></div>
      ) : (
        <DataTable columns={columns} data={boms} title="Bill of Materials"
          expandRow={(row) => (
            <div className="p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Components</p>
              {(row as BOM).items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm text-muted-foreground px-4 py-1 bg-muted/50 rounded">
                  <span>{it.item?.name} ({it.item?.sku})</span>
                  <span className="font-medium">x{it.quantity} @ {it.unitCost} = {(it.quantity * it.unitCost).toLocaleString()}</span>
                </div>
              ))}
              {(row as BOM).totalCost > 0 && (
                <div className="flex justify-between text-sm font-bold text-primary px-4 pt-2 border-t border-border">
                  <span>Total Cost (per {row.quantity} unit{(row.quantity || 1) > 1 ? 's' : ''})</span>
                  <span>{(row as BOM).totalCost?.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <motion.button onClick={async () => { setEditing(row as BOM); setForm({ name: (row as BOM).name, itemId: (row as BOM).item?.id || '', quantity: String((row as BOM).quantity || 1) }); const bRes = await fetch(`/api/manufacturing/bom/${row.id}`); const bData = await bRes.json(); if (bData.bom) { setBomItems(bData.bom.items.map((i: BOMItem) => ({ itemId: i.itemId, quantity: String(i.quantity), unitCost: String(i.unitCost) }))); setShowForm(true) } }} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
              <motion.button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
            </div>
          )}
        />
      )}
    </div>
  )
}