'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Type { id: string; name: string; isDefault: boolean; _count: { calls: number } }

export default function CallTypesPage() {
  const [types, setTypes] = useState<Type[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Type | null>(null)
  const [form, setForm] = useState({ name: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true); setError('')
    try { const res = await fetch('/api/crm/call-types'); const d = await res.json(); if (!res.ok) throw new Error(d.error); setTypes(d.types) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '' }); setShowForm(true) }
  const openEdit = (t: Type) => { setEditing(t); setForm({ name: t.name }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.name.trim()) { setError('Name required'); return }
    setSaving(true); setError('')
    try {
      const url = editing ? `/api/crm/call-types/${editing.id}` : '/api/crm/call-types'
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowForm(false); setEditing(null); fetchData()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (t: Type) => {
    if (!window.confirm(`Delete "${t.name}"?`)) return
    try { const res = await fetch(`/api/crm/call-types/${t.id}`, { method: 'DELETE' }); const d = await res.json(); if (!res.ok) throw new Error(d.error); fetchData() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Call Types</h1><p className="text-muted-foreground mt-1">Manage call type options</p></div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" />New Type</motion.button>
      </motion.div>
      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}
      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Type' : 'New Call Type'}</h3>
            <input type="text" placeholder="Type Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Update' : 'Save'}</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      ) : (
        <DataTable columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'isDefault', label: 'Default', render: (_: unknown, row: Type) => row.isDefault ? <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span> : '-' },
          { key: '_count.calls', label: 'Calls', render: (_: unknown, row: Type) => <span>{row._count.calls}</span> },
        ]} data={types} title="All Call Types" actions={(row: Type) => (
          <div className="flex items-center gap-1">
            <motion.button onClick={() => openEdit(row)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
            <motion.button onClick={() => handleDelete(row)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
          </div>
        )} />
      )}
    </div>
  )
}