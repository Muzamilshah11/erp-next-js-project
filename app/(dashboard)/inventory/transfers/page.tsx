'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Search, X, Loader2, ArrowRightLeft, CheckCircle, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface InventoryItem { id: string; name: string; sku: string; quantity: number }
interface Warehouse { id: string; name: string }
interface TransferItem { itemId: string; quantity: number; item?: InventoryItem }
interface StockTransfer {
  id: string; transferNo: string; fromWarehouse: Warehouse; toWarehouse: Warehouse
  date: string; status: string; items: TransferItem[]
}

const statuses = ['draft', 'completed', 'cancelled']
const statusConfig: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

const columns = [
  { key: 'transferNo' as const, label: 'Transfer No', sortable: true,
    render: (value: string) => <span className="font-mono font-semibold text-primary">{value}</span>,
  },
  { key: 'fromWarehouse' as const, label: 'From',
    render: (v: Warehouse) => v?.name || '-',
  },
  { key: 'toWarehouse' as const, label: 'To',
    render: (v: Warehouse) => v?.name || '-',
  },
  { key: 'date' as const, label: 'Date', sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString(),
  },
  { key: 'items' as const, label: 'Items',
    render: (v: TransferItem[]) => String(v?.length || 0),
  },
  { key: 'status' as const, label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[value] || statusConfig.draft}`}>{value}</span>
    ),
  },
]

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fromWarehouseId: '', toWarehouseId: '', date: new Date().toISOString().split('T')[0], status: 'draft' })
  const [transferItems, setTransferItems] = useState<{ itemId: string; quantity: string }[]>([])

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const [tRes, iRes, wRes] = await Promise.all([
        fetch('/api/inventory/transfers'), fetch('/api/inventory/items'), fetch('/api/inventory/warehouses'),
      ])
      const tData = await tRes.json(); const iData = await iRes.json(); const wData = await wRes.json()
      if (!tRes.ok) throw new Error(tData.error || 'Failed')
      setTransfers(tData.transfers || [])
      setItems(iData.items || [])
      setWarehouses(wData.warehouses || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openNew = () => {
    setForm({ fromWarehouseId: '', toWarehouseId: '', date: new Date().toISOString().split('T')[0], status: 'draft' })
    setTransferItems([]); setShowForm(true)
  }

  const addItem = () => setTransferItems([...transferItems, { itemId: '', quantity: '1' }])
  const removeItem = (i: number) => setTransferItems(transferItems.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...transferItems]; updated[i] = { ...updated[i], [field]: value }; setTransferItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const body = {
        ...form,
        items: transferItems.map(it => ({ itemId: it.itemId, quantity: parseInt(it.quantity) || 1 })),
      }
      const res = await fetch('/api/inventory/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false); fetchData()
    } catch { setError('Failed to create transfer') } finally { setSaving(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/inventory/transfers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error()
      fetchData()
    } catch { setError('Failed to update status') }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this transfer?')) return
    try { const res = await fetch(`/api/inventory/transfers/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); fetchData() }
    catch { setError('Failed to delete') }
  }

  const selectedFromItems = items.filter(i => i.warehouseId === form.fromWarehouseId || !i.warehouseId)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><ArrowRightLeft className="w-8 h-8 text-primary" /> Stock Transfers</h1>
          <p className="text-muted-foreground mt-1">Track stock movements between warehouses</p>
        </div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> New Transfer
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search transfers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">New Stock Transfer</h3>
            <div className="grid grid-cols-3 gap-4">
              <select value={form.fromWarehouseId} onChange={e => setForm({ ...form, fromWarehouseId: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">From Warehouse</option>
                {warehouses.filter(w => w.id !== form.toWarehouseId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select value={form.toWarehouseId} onChange={e => setForm({ ...form, toWarehouseId: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">To Warehouse</option>
                {warehouses.filter(w => w.id !== form.fromWarehouseId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Items</span>
                <button type="button" onClick={addItem} className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium">+ Add Item</button>
              </div>
              {transferItems.length === 0 && <p className="text-sm text-muted-foreground py-2">No items added yet.</p>}
              {transferItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <select value={item.itemId} onChange={e => updateItem(idx, 'itemId', e.target.value)} required className="flex-1 px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select Item</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku}) - Qty: {i.quantity}</option>)}
                  </select>
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required min="1" className="w-24 px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <button type="button" onClick={() => removeItem(idx)} className="p-2 text-muted-foreground hover:text-destructive"><XCircle className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}Create Transfer
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading transfers...</p></div>
      ) : (
        <DataTable columns={columns} data={transfers} title="Stock Transfers"
          expandRow={(row) => (
            <div className="p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Items</p>
              {(row as StockTransfer).items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm text-muted-foreground px-4 py-1 bg-muted/50 rounded">
                  <span>{it.item?.name || it.itemId} ({it.item?.sku || ''})</span>
                  <span className="font-semibold text-foreground">x{it.quantity}</span>
                </div>
              ))}
            </div>
          )}
          actions={(row) => (
            <div className="flex items-center gap-1">
              {(row as StockTransfer).status === 'draft' && (
                <motion.button onClick={() => updateStatus(row.id, 'completed')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Complete Transfer"><CheckCircle className="w-4 h-4" /></motion.button>
              )}
              {(row as StockTransfer).status === 'draft' && (
                <motion.button onClick={() => updateStatus(row.id, 'cancelled')} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Cancel"><XCircle className="w-4 h-4" /></motion.button>
              )}
              {(row as StockTransfer).status === 'draft' && (
                <motion.button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
              )}
            </div>
          )}
        />
      )}
    </div>
  )
}