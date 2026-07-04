'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Pencil, Trash2, Search, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Query { id: string; queryNo: string; subject: string; customer: { id: string; name: string }; assignee: { id: string; fullName: string } | null; source: { id: string; name: string } | null; status: string; createdAt: string }
interface Customer { id: string; name: string }
interface QuerySource { id: string; name: string }

export default function QueriesPage() {
  const [queries, setQueries] = useState<Query[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sources, setSources] = useState<QuerySource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Query | null>(null)
  const [form, setForm] = useState({ customerId: '', assignedTo: '', sourceId: '', subject: '', description: '', status: 'open' })
  const [saving, setSaving] = useState(false)

  const fetchQueries = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/crm/queries?${params}`); const d = await res.json()
      if (!res.ok) throw new Error(d.error); setQueries(d.queries)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchQueries()
    fetch('/api/sales/customers').then(r => r.json()).then(d => setCustomers(d.customers)).catch(() => {})
    fetch('/api/crm/query-sources').then(r => r.json()).then(d => setSources(d.sources)).catch(() => {})
  }, [])

  const openNew = () => { setEditing(null); setForm({ customerId: '', assignedTo: '', sourceId: '', subject: '', description: '', status: 'open' }); setShowForm(true) }
  const openEdit = (q: Query) => { setEditing(q); setForm({ customerId: q.customer.id, assignedTo: q.assignee?.id || '', sourceId: q.source?.id || '', subject: q.subject, description: '', status: q.status }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.customerId || !form.subject) { setError('Customer and subject required'); return }
    setSaving(true); setError('')
    try {
      const url = editing ? `/api/crm/queries/${editing.id}` : '/api/crm/queries'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowForm(false); setEditing(null); fetchQueries()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (q: Query) => {
    if (!window.confirm('Delete this query?')) return
    try { const res = await fetch(`/api/crm/queries/${q.id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Failed'); fetchQueries() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete') }
  }

  const statusColors: Record<string, string> = { open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', 'in-progress': 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', resolved: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Queries</h1><p className="text-muted-foreground mt-1">Track customer queries</p></div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" />New Query</motion.button>
      </motion.div>

      <div className="flex gap-4 flex-wrap items-end">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search queries..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-input rounded-lg bg-background"><option value="">All Status</option><option value="open">Open</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
        <button onClick={fetchQueries} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Filter</button>
      </div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Query' : 'New Query'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-muted-foreground mb-1">Customer *</label><select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="">Select</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Source</label><select value={form.sourceId} onChange={e => setForm({ ...form, sourceId: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="">Select</option>{sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <input type="text" placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="open">Open</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div>
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="col-span-2 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Update' : 'Create'}</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading queries...</p></div>
      ) : (
        <DataTable columns={[
          { key: 'queryNo', label: 'Query No', sortable: true },
          { key: 'subject', label: 'Subject' },
          { key: 'customer.name', label: 'Customer' },
          { key: 'assignee.fullName', label: 'Assigned To', render: (_: unknown, row: Query) => row.assignee?.fullName || '-' },
          { key: 'source.name', label: 'Source', render: (_: unknown, row: Query) => row.source?.name || '-' },
          { key: 'status', label: 'Status', render: (_: unknown, row: Query) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || ''}`}>{row.status}</span> },
          { key: 'createdAt', label: 'Date', render: (_: unknown, row: Query) => new Date(row.createdAt).toLocaleDateString() },
        ]} data={queries} title="All Queries" actions={(row: Query) => (
          <div className="flex items-center gap-1">
            <motion.button onClick={() => openEdit(row)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
            <motion.button onClick={() => handleDelete(row)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
          </div>
        )} />
      )}
    </div>
  )
}