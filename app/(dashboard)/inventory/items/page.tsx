'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, AlertTriangle, TrendingUp, Trash2, Pencil, Search, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Warehouse { id: string; name: string }

interface InventoryItem {
  id: string; sku: string; name: string; category: string
  quantity: number; reorderLevel: number; unitPrice: number
  value: number; status: 'in-stock' | 'low-stock' | 'out-of-stock'
  warehouse?: { id: string; name: string } | null
  warehouseId?: string | null
}

const statusConfig: Record<string, string> = {
  'in-stock': 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  'low-stock': 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  'out-of-stock': 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

const columns = [
  { key: 'sku' as const, label: 'SKU', sortable: true,
    render: (value: string) => <span className="font-mono text-sm font-semibold text-primary">{value}</span>,
  },
  { key: 'name' as const, label: 'Product Name', sortable: true,
    render: (value: string) => <span className="font-medium">{value}</span>,
  },
  { key: 'category' as const, label: 'Category', sortable: true },
  { key: 'quantity' as const, label: 'Qty In Stock', sortable: true,
    render: (value: number, row: InventoryItem) => (
      <span className={`flex items-center gap-1 font-semibold ${value === 0 ? 'text-red-600' : value < row.reorderLevel ? 'text-amber-600' : 'text-green-600'}`}>
        {value === 0 && <AlertTriangle className="w-3 h-3" />}
        {value < row.reorderLevel && value > 0 && <TrendingUp className="w-3 h-3" />}
        {value}
      </span>
    ),
  },
  { key: 'reorderLevel' as const, label: 'Reorder Level', sortable: true },
  { key: 'unitPrice' as const, label: 'Unit Price',
    render: (value: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(value),
  },
  { key: 'value' as const, label: 'Total Value', sortable: true,
    render: (value: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(value),
  },
  { key: 'warehouse' as const, label: 'Warehouse',
    render: (value: { name: string } | null | undefined) => value?.name || '-',
  },
  { key: 'status' as const, label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[value] || statusConfig['in-stock']}`}>
        {value.replace('-', ' ')}
      </span>
    ),
  },
]

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', category: '', unitPrice: '', quantity: '', reorderLevel: '', warehouseId: '' })

  const fetchItems = async (q = '') => {
    setLoading(true); setError('')
    try {
      const url = q ? `/api/inventory/items?q=${encodeURIComponent(q)}` : '/api/inventory/items'
      const [iRes, wRes] = await Promise.all([fetch(url), fetch('/api/inventory/warehouses')])
      const iData = await iRes.json(); const wData = await wRes.json()
      if (!iRes.ok) throw new Error(iData.error || 'Failed to fetch')
      setItems((iData.items || []).map((item: { unitPrice: number; quantity: number; reorderLevel: number }) => ({
        ...item, value: item.unitPrice * item.quantity,
      })))
      setWarehouses(wData.warehouses || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchItems() }, [])
  useEffect(() => { const t = setTimeout(() => fetchItems(search), 300); return () => clearTimeout(t) }, [search])

  const openNew = () => { setEditing(null); setForm({ name: '', sku: '', category: '', unitPrice: '', quantity: '', reorderLevel: '', warehouseId: '' }); setShowForm(true) }
  const openEdit = (item: InventoryItem) => {
    setEditing(item)
    setForm({ name: item.name, sku: item.sku, category: item.category, unitPrice: String(item.unitPrice), quantity: String(item.quantity), reorderLevel: String(item.reorderLevel), warehouseId: item.warehouseId || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const body = {
        ...form, unitPrice: parseFloat(form.unitPrice) || 0, quantity: parseInt(form.quantity) || 0,
        reorderLevel: parseInt(form.reorderLevel) || 0, warehouseId: form.warehouseId || null,
      }
      const url = editing ? `/api/inventory/items/${editing.id}` : '/api/inventory/items'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false); setEditing(null); setForm({ name: '', sku: '', category: '', unitPrice: '', quantity: '', reorderLevel: '', warehouseId: '' })
      fetchItems(search)
    } catch { setError('Failed to save item') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item?')) return
    try { const res = await fetch(`/api/inventory/items/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); fetchItems(search) }
    catch { setError('Failed to delete') }
  }

  const totalValue = items.reduce((s, i) => s + i.value, 0)
  const lowStockItems = items.filter(i => i.quantity < i.reorderLevel && i.quantity > 0)
  const outOfStock = items.filter(i => i.quantity === 0)
  const curr = (v: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Items</h1>
          <p className="text-muted-foreground mt-1">Track stock levels and manage inventory</p>
        </div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> Add Item
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Total Inventory Value" value={curr(totalValue)} color="blue" />
        <SummaryCard label="Low Stock Items" value={String(lowStockItems.length)} color="amber" />
        <SummaryCard label="Out of Stock" value={String(outOfStock.length)} color="red" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Item' : 'Add New Item'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Item Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="text" placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select Category</option>
                <option>Electronics</option><option>Furniture</option><option>Accessories</option><option>Raw Material</option><option>Finished Goods</option>
              </select>
              <input type="number" placeholder="Unit Price" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="number" placeholder="Reorder Level" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <select value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">No Warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Update' : 'Add Item'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading items...</p></div>
      ) : (
        <DataTable columns={columns} data={items} title="Inventory Items"
          actions={(row) => (
            <div className="flex items-center gap-1">
              <motion.button onClick={() => openEdit(row as InventoryItem)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
              <motion.button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
            </div>
          )}
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30',
    amber: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30',
    red: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800/30',
  }
  return (
    <motion.div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
    </motion.div>
  )
}