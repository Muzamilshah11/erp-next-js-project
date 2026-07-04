'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Pencil, Search, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WorkCenter { id: string; name: string; description: string | null; status: string }

const columns = [
  { key: 'name' as const, label: 'Name', sortable: true,
    render: (value: string) => <span className="font-medium">{value}</span>,
  },
  { key: 'description' as const, label: 'Description',
    render: (value: string | null) => <span className="text-sm text-muted-foreground">{value || '-'}</span>,
  },
  { key: 'status' as const, label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${value === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{value}</span>
    ),
  },
]

export default function WorkCentersPage() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<WorkCenter | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', status: 'active' })

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/manufacturing/work-centers'); const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setWorkCenters(data.workCenters || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', status: 'active' }); setShowForm(true) }
  const openEdit = (wc: WorkCenter) => { setEditing(wc); setForm({ name: wc.name, description: wc.description || '', status: wc.status }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const url = editing ? `/api/manufacturing/work-centers/${editing.id}` : '/api/manufacturing/work-centers'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false); setEditing(null); fetchData()
    } catch { setError('Failed to save work center') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this work center?')) return
    try { const res = await fetch(`/api/manufacturing/work-centers/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); fetchData() }
    catch { setError('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Work Centers</h1><p className="text-muted-foreground mt-1">Manage production units</p></div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> Add Work Center
        </motion.button>
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Work Center' : 'New Work Center'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Work Center Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
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
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      ) : (
        <DataTable columns={columns} data={workCenters} title="Work Centers"
          actions={(row) => (
            <div className="flex items-center gap-1">
              <motion.button onClick={() => openEdit(row as WorkCenter)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
              <motion.button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
            </div>
          )}
        />
      )}
    </div>
  )
}