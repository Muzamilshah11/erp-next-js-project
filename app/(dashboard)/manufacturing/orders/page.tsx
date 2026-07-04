'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Search, X, Loader2, Play, CheckCircle, XCircle, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface InvItem { id: string; name: string; sku: string }
interface Warehouse { id: string; name: string }
interface WorkCenter { id: string; name: string }
interface BOM { id: string; bomNo: string; name: string }
interface WOItem { id: string; item: InvItem; quantity: number; consumedQty: number; type: string }
interface WorkOrder {
  id: string; workOrderNo: string; type: string; item: InvItem; bom: BOM | null
  workCenter: WorkCenter | null; sourceWarehouse: Warehouse | null; destinationWarehouse: Warehouse | null
  quantity: number; producedQty: number; status: string; startDate: string | null; endDate: string | null
  items: WOItem[]
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

const columns = [
  { key: 'workOrderNo' as const, label: 'Order No', sortable: true, render: (v: string) => <span className="font-mono font-semibold text-primary">{v}</span> },
  { key: 'type' as const, label: 'Type', sortable: true,
    render: (v: string) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${v === 'assemble' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'}`}>{v}</span>,
  },
  { key: 'item' as const, label: 'Item', sortable: true, render: (v: InvItem) => <span className="font-medium">{v?.name}</span> },
  { key: 'quantity' as const, label: 'Qty', sortable: true, render: (v: number) => v },
  { key: 'producedQty' as const, label: 'Produced', render: (v: number) => v || 0 },
  { key: 'status' as const, label: 'Status',
    render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[v] || statusColors.draft}`}>{v}</span>,
  },
  { key: 'workCenter' as const, label: 'Work Center', render: (v: WorkCenter | null) => v?.name || '-' },
]

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [items, setItems] = useState<InvItem[]>([]); const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]); const [boms, setBoms] = useState<BOM[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [filterType, setFilterType] = useState(''); const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false); const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'assemble', itemId: '', bomId: '', workCenterId: '', sourceWarehouseId: '', destinationWarehouseId: '', quantity: '1' })

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType); if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/manufacturing/orders?${params}`); const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setOrders(data.orders || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterType, filterStatus])

  const loadFormData = async () => {
    try {
      const [iRes, wRes, wcRes, bRes] = await Promise.all([
        fetch('/api/inventory/items'), fetch('/api/inventory/warehouses'),
        fetch('/api/manufacturing/work-centers'), fetch('/api/manufacturing/bom'),
      ])
      const iData = await iRes.json(); const wData = await wRes.json()
      const wcData = await wcRes.json(); const bData = await bRes.json()
      setItems(iData.items || []); setWarehouses(wData.warehouses || [])
      setWorkCenters(wcData.workCenters || []); setBoms(bData.boms || [])
    } catch {}
  }

  const openNew = async () => {
    setForm({ type: 'assemble', itemId: '', bomId: '', workCenterId: '', sourceWarehouseId: '', destinationWarehouseId: '', quantity: '1' })
    await loadFormData(); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const body = { ...form, quantity: parseInt(form.quantity) || 1, bomId: form.type === 'assemble' ? form.bomId : undefined }
      const res = await fetch('/api/manufacturing/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to create')
      setShowForm(false); fetchData()
    } catch { setError('Failed to create work order') } finally { setSaving(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/manufacturing/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error(); fetchData()
    } catch { setError('Failed to update status') }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this work order?')) return
    try { const res = await fetch(`/api/manufacturing/orders/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); fetchData() }
    catch { setError('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Work Orders</h1><p className="text-muted-foreground mt-1">Manage production and un-assembly orders</p></div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> New Work Order
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 flex-wrap">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Types</option><option value="assemble">Assemble</option><option value="unassemble">Un-Assemble</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Status</option><option value="draft">Draft</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">New Work Order</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, bomId: '' })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="assemble">Assemble (Production)</option><option value="unassemble">Un-Assemble (Reverse)</option>
              </select>
              <select value={form.workCenterId} onChange={e => setForm({ ...form, workCenterId: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select Work Center</option>
                {workCenters.map(wc => <option key={wc.id} value={wc.id}>{wc.name}</option>)}
              </select>
              <select value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select Item</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </select>
              {form.type === 'assemble' && (
                <select value={form.bomId} onChange={e => setForm({ ...form, bomId: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select BOM</option>
                  {boms.filter(b => b.item?.id === form.itemId || !form.itemId).map(b => <option key={b.id} value={b.id}>{b.bomNo} - {b.name}</option>)}
                </select>
              )}
              <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required min="1" className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              {form.type === 'assemble' ? (
                <select value={form.destinationWarehouseId} onChange={e => setForm({ ...form, destinationWarehouseId: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Destination Warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              ) : (
                <select value={form.sourceWarehouseId} onChange={e => setForm({ ...form, sourceWarehouseId: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Source Warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}Create
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading work orders...</p></div>
      ) : (
        <DataTable columns={columns} data={orders} title="Work Orders"
          expandRow={(row) => (
            <div className="p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Components</p>
              {(row as WorkOrder).items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm text-muted-foreground px-4 py-1 bg-muted/50 rounded">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${it.type === 'finished-good' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    {it.item?.name} ({it.item?.sku})
                  </span>
                  <span className="font-medium">{it.type === 'finished-good' ? `Produces: ${it.quantity}` : `Consumes: ${it.quantity}`}</span>
                </div>
              ))}
            </div>
          )}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Link href={`/manufacturing/orders/${row.id}`} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" title="View Detail"><Eye className="w-4 h-4" /></Link>
              {(row as WorkOrder).status === 'draft' && (
                <motion.button onClick={() => updateStatus(row.id, 'in-progress')} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Start"><Play className="w-4 h-4" /></motion.button>
              )}
              {(row as WorkOrder).status === 'in-progress' && (
                <motion.button onClick={() => updateStatus(row.id, 'completed')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Complete"><CheckCircle className="w-4 h-4" /></motion.button>
              )}
              {(row as WorkOrder).status === 'draft' && (
                <motion.button onClick={() => updateStatus(row.id, 'cancelled')} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Cancel"><XCircle className="w-4 h-4" /></motion.button>
              )}
              {(row as WorkOrder).status === 'draft' && (
                <motion.button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
              )}
            </div>
          )}
        />
      )}
    </div>
  )
}