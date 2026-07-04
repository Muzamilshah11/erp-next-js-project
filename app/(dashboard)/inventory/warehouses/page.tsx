'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Pencil, Search, X, Loader2, Building2, MapPin, Hash } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Warehouse {
  id: string; name: string; code: string; location: string;
  capacity: number; status: string; _count: { inventoryItems: number };
}

const statusConfig: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const columns = [
  { key: 'code' as const, label: 'Code', sortable: true,
    render: (value: string) => <span className="font-mono font-semibold text-primary">{value}</span>,
  },
  { key: 'name' as const, label: 'Warehouse', sortable: true,
    render: (value: string) => <span className="font-medium">{value}</span>,
  },
  { key: 'location' as const, label: 'Location', sortable: true,
    render: (value: string) => <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" />{value || '-'}</span>,
  },
  { key: 'capacity' as const, label: 'Capacity',
    render: (v: number) => new Intl.NumberFormat().format(v),
  },
  { key: '_count' as const, label: 'Items',
    render: (v: { inventoryItems: number }) => <span className="font-semibold">{v.inventoryItems}</span>,
  },
  { key: 'status' as const, label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[value] || statusConfig.active}`}>
        {value}
      </span>
    ),
  },
]

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<Warehouse | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', location: '', capacity: '' })

  const fetchData = async (q = '') => {
    setLoading(true); setError('')
    try {
      const url = q ? `/api/inventory/warehouses?q=${encodeURIComponent(q)}` : '/api/inventory/warehouses'
      const res = await fetch(url); const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setWarehouses(data.warehouses || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => { const t = setTimeout(() => fetchData(search), 300); return () => clearTimeout(t) }, [search])

  const openNew = () => { setEditing(null); setForm({ name: '', code: '', location: '', capacity: '' }); setShowForm(true) }
  const openEdit = (w: Warehouse) => { setEditing(w); setForm({ name: w.name, code: w.code, location: w.location, capacity: String(w.capacity) }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const body = { ...form, capacity: parseInt(form.capacity) || 0 }
      const url = editing ? `/api/inventory/warehouses/${editing.id}` : '/api/inventory/warehouses'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false); setEditing(null); fetchData(search)
    } catch { setError('Failed to save warehouse') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this warehouse?')) return
    try { const res = await fetch(`/api/inventory/warehouses/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); fetchData(search) }
    catch { setError('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Building2 className="w-8 h-8 text-primary" /> Warehouses</h1>
          <p className="text-muted-foreground mt-1">Manage warehouse locations and capacity</p>
        </div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> Add Warehouse
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search warehouses..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Hash className="w-5 h-5 text-primary" />{editing ? 'Edit Warehouse' : 'New Warehouse'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Warehouse Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="text" placeholder="Warehouse Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="number" placeholder="Capacity" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading warehouses...</p></div>
      ) : (
        <DataTable columns={columns} data={warehouses} title="Warehouses"
          actions={(row) => (
            <div className="flex items-center gap-1">
              <motion.button onClick={() => openEdit(row as Warehouse)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
              <motion.button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
            </div>
          )}
        />
      )}
    </div>
  )
}