'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Search, X, Loader2, Eye, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Ticket { id: string; ticketNo: string; subject: string; priority: string; customer: { id: string; name: string }; assignee: { id: string; fullName: string } | null; status: { id: string; name: string; color: string }; dueDate: string | null; createdAt: string; _count: { comments: number } }
interface Customer { id: string; name: string }
interface Status { id: string; name: string }
interface User { id: string; fullName: string }

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customerId: '', assignedTo: '', subject: '', description: '', priority: 'medium', statusId: '', dueDate: '' })
  const [saving, setSaving] = useState(false)

  const fetchTickets = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (filterStatus) params.set('statusId', filterStatus)
      if (filterPriority) params.set('priority', filterPriority)
      const res = await fetch(`/api/crm/tickets?${params}`); const d = await res.json()
      if (!res.ok) throw new Error(d.error); setTickets(d.tickets)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets(); fetch('/api/sales/customers').then(r => r.json()).then(d => setCustomers(d.customers)).catch(() => {}); fetch('/api/crm/ticket-status').then(r => r.json()).then(d => setStatuses(d.statuses)).catch(() => {}); fetch('/api/auth/me').then(r => r.json()).then(d => setUsers(d.user ? [d.user] : [])).catch(() => {}) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.customerId || !form.subject || !form.statusId) { setError('Customer, subject, status required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/crm/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowForm(false); setForm({ customerId: '', assignedTo: '', subject: '', description: '', priority: 'medium', statusId: '', dueDate: '' }); fetchTickets()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to create') }
    finally { setSaving(false) }
  }

  const priorityColors: Record<string, string> = { low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400', medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', critical: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Tickets</h1><p className="text-muted-foreground mt-1">Manage customer support tickets</p></div>
        <motion.button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" />New Ticket</motion.button>
      </motion.div>

      <div className="flex gap-4 flex-wrap items-end">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-input rounded-lg bg-background"><option value="">All Status</option>{statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-4 py-2 border border-input rounded-lg bg-background"><option value="">All Priority</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
        <button onClick={fetchTickets} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Filter</button>
      </div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">New Ticket</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-muted-foreground mb-1">Customer *</label><select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="">Select</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Status *</label><select value={form.statusId} onChange={e => setForm({ ...form, statusId: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="">Select</option>{statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <input type="text" placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="col-span-2 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Create</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading tickets...</p></div>
      ) : (
        <DataTable columns={[
          { key: 'ticketNo', label: 'Ticket', sortable: true },
          { key: 'subject', label: 'Subject' },
          { key: 'customer.name', label: 'Customer' },
          { key: 'assignee.fullName', label: 'Assigned To', render: (_: unknown, row: Ticket) => row.assignee?.fullName || '-' },
          { key: 'priority', label: 'Priority', render: (_: unknown, row: Ticket) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[row.priority] || ''}`}>{row.priority}</span> },
          { key: 'status.name', label: 'Status', render: (_: unknown, row: Ticket) => <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: row.status.color + '20', color: row.status.color }}>{row.status.name}</span> },
          { key: '_count.comments', label: '', render: (_: unknown, row: Ticket) => <span className="flex items-center gap-1 text-muted-foreground"><MessageSquare className="w-3 h-3" />{row._count.comments}</span> },
        ]} data={tickets} title="All Tickets" actions={(row: Ticket) => (
          <Link href={`/crm/tickets/${row.id}`} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex"><Eye className="w-4 h-4" /></Link>
        )} />
      )}
    </div>
  )
}