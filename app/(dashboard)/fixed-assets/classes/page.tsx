'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Pencil, Search, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AssetClass { id: string; name: string; description: string | null; usefulLife: number; salvageValue: number; defaultRate: number | null; _count: { assets: number } }

export default function ClassesPage() {
  const [classes, setClasses] = useState<AssetClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AssetClass | null>(null)
  const [form, setForm] = useState({ name: '', description: '', usefulLife: '5', salvageValue: '0', defaultRate: '' })
  const [saving, setSaving] = useState(false)

  const fetchClasses = async () => {
    setLoading(true); setError('')
    try { const res = await fetch('/api/fixed-assets/classes'); const d = await res.json(); if (!res.ok) throw new Error(d.error); setClasses(d.classes) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchClasses() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', usefulLife: '5', salvageValue: '0', defaultRate: '' }); setShowForm(true) }
  const openEdit = (c: AssetClass) => { setEditing(c); setForm({ name: c.name, description: c.description || '', usefulLife: String(c.usefulLife), salvageValue: String(c.salvageValue), defaultRate: c.defaultRate ? String(c.defaultRate) : '' }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.name.trim() || !form.usefulLife) { setError('Name and useful life required'); return }
    setSaving(true); setError('')
    try {
      const url = editing ? `/api/fixed-assets/classes/${editing.id}` : '/api/fixed-assets/classes'
      const body = JSON.stringify({ ...form, usefulLife: parseInt(form.usefulLife), salvageValue: parseFloat(form.salvageValue), defaultRate: form.defaultRate ? parseFloat(form.defaultRate) : null })
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowForm(false); setEditing(null); setForm({ name: '', description: '', usefulLife: '5', salvageValue: '0', defaultRate: '' }); fetchClasses()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (c: AssetClass) => {
    if (!window.confirm(`Delete "${c.name}"?`)) return
    try { const res = await fetch(`/api/fixed-assets/classes/${c.id}`, { method: 'DELETE' }); if (!res.ok) { const d = await res.json(); throw new Error(d.error) }; fetchClasses() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete') }
  }

  const filtered = classes.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Asset Classes</h1><p className="text-muted-foreground mt-1">Define asset classes with depreciation rules</p></div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" />New Class</motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Class' : 'Add New Class'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Useful Life (Years) *</label><input type="number" min={1} value={form.usefulLife} onChange={e => setForm({ ...form, usefulLife: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Salvage Value</label><input type="number" min={0} step={0.01} value={form.salvageValue} onChange={e => setForm({ ...form, salvageValue: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Default Rate %</label><input type="number" min={0} step={0.01} value={form.defaultRate} onChange={e => setForm({ ...form, defaultRate: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Update' : 'Save'}</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading classes...</p></div>
      ) : (
        <DataTable columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'usefulLife', label: 'Useful Life (Yrs)' },
          { key: 'salvageValue', label: 'Salvage Value' },
          { key: 'defaultRate', label: 'Default Rate', render: (_: unknown, row: AssetClass) => row.defaultRate != null ? `${row.defaultRate}%` : '-' },
          { key: '_count.assets', label: 'Assets', render: (_: unknown, row: AssetClass) => <span>{row._count.assets}</span> },
        ]} data={filtered} title="All Classes" actions={(row: AssetClass) => (
          <div className="flex items-center gap-1">
            <motion.button onClick={() => openEdit(row)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
            <motion.button onClick={() => handleDelete(row)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
          </div>
        )} />
      )}
    </div>
  )
}