'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Pencil, Trash2, Search, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Task { id: string; taskNo: string; title: string; priority: string; assignee: { id: string; fullName: string } | null; status: { id: string; name: string; color: string }; duration: number; dueDate: string | null; createdAt: string }
interface Status { id: string; name: string }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', statusId: '', duration: '0', dueDate: '' })
  const [saving, setSaving] = useState(false)

  const fetchTasks = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (filterStatus) params.set('statusId', filterStatus)
      if (filterPriority) params.set('priority', filterPriority)
      const res = await fetch(`/api/crm/tasks?${params}`); const d = await res.json()
      if (!res.ok) throw new Error(d.error); setTasks(d.tasks)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTasks(); fetch('/api/crm/task-status').then(r => r.json()).then(d => setStatuses(d.statuses)).catch(() => {}) }, [])

  const openNew = () => { setEditing(null); setForm({ title: '', description: '', assignedTo: '', priority: 'medium', statusId: '', duration: '0', dueDate: '' }); setShowForm(true) }
  const openEdit = (t: Task) => { setEditing(t); setForm({ title: t.title, description: '', assignedTo: t.assignee?.id || '', priority: t.priority, statusId: t.status.id, duration: String(t.duration), dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '' }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.title || !form.statusId) { setError('Title and status required'); return }
    setSaving(true); setError('')
    try {
      const url = editing ? `/api/crm/tasks/${editing.id}` : '/api/crm/tasks'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, duration: parseInt(form.duration) || 0, dueDate: form.dueDate || null }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowForm(false); setEditing(null); fetchTasks()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (t: Task) => {
    if (!window.confirm('Delete this task?')) return
    try { const res = await fetch(`/api/crm/tasks/${t.id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Failed'); fetchTasks() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete') }
  }

  const priorityColors: Record<string, string> = { low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400', medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', critical: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Tasks</h1><p className="text-muted-foreground mt-1">Manage internal tasks</p></div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" />New Task</motion.button>
      </motion.div>

      <div className="flex gap-4 flex-wrap items-end">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-input rounded-lg bg-background"><option value="">All Status</option>{statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-4 py-2 border border-input rounded-lg bg-background"><option value="">All Priority</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
        <button onClick={fetchTasks} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Filter</button>
      </div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Task' : 'New Task'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Status *</label><select value={form.statusId} onChange={e => setForm({ ...form, statusId: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="">Select</option>{statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="col-span-2 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Duration (min)</label><input type="number" min={0} value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background" /></div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Update' : 'Create'}</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading tasks...</p></div>
      ) : (
        <DataTable columns={[
          { key: 'taskNo', label: 'Task No', sortable: true },
          { key: 'title', label: 'Title' },
          { key: 'priority', label: 'Priority', render: (_: unknown, row: Task) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[row.priority] || ''}`}>{row.priority}</span> },
          { key: 'assignee.fullName', label: 'Assigned To', render: (_: unknown, row: Task) => row.assignee?.fullName || '-' },
          { key: 'status.name', label: 'Status', render: (_: unknown, row: Task) => <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: row.status.color + '20', color: row.status.color }}>{row.status.name}</span> },
          { key: 'duration', label: 'Duration (min)' },
          { key: 'dueDate', label: 'Due Date', render: (_: unknown, row: Task) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-' },
        ]} data={tasks} title="All Tasks" actions={(row: Task) => (
          <div className="flex items-center gap-1">
            <motion.button onClick={() => openEdit(row)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
            <motion.button onClick={() => handleDelete(row)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
          </div>
        )} />
      )}
    </div>
  )
}