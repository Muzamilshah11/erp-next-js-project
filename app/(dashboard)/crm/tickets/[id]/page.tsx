'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { ArrowLeft, Loader2, Pencil, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Ticket { id: string; ticketNo: string; subject: string; description: string | null; priority: string; customer: { id: string; name: string; email: string; phone: string }; assignee: { id: string; fullName: string; email: string } | null; status: { id: string; name: string; color: string }; dueDate: string | null; createdAt: string; comments: Comment[] }
interface Comment { id: string; body: string; createdAt: string; user: { fullName: string } | null }
interface Status { id: string; name: string }

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ subject: '', priority: '', statusId: '', assignedTo: '', dueDate: '' })
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTicket = async () => {
    setLoading(true)
    try { const res = await fetch(`/api/crm/tickets/${id}`); const d = await res.json(); if (!res.ok) throw new Error(d.error); setTicket(d.ticket) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) { fetchTicket(); fetch('/api/crm/ticket-status').then(r => r.json()).then(d => setStatuses(d.statuses)).catch(() => {}) } }, [id])

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch(`/api/crm/tickets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowEdit(false); fetchTicket()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to update') }
    finally { setSaving(false) }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault(); if (!comment.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/crm/tickets/${id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: comment }) })
      if (!res.ok) throw new Error('Failed to add comment')
      setComment(''); fetchTicket()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to comment') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading ticket...</p></div>
  if (!ticket) return <div className="p-6 text-center text-muted-foreground">Ticket not found</div>

  const priorityColors: Record<string, string> = { low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400', medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', critical: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link href="/crm/tickets"><motion.button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }}><ArrowLeft className="w-5 h-5" /></motion.button></Link>
        <h1 className="text-2xl font-bold text-foreground">{ticket.ticketNo} - {ticket.subject}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority] || ''}`}>{ticket.priority}</span>
        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: ticket.status.color + '20', color: ticket.status.color }}>{ticket.status.name}</span>
        <motion.button onClick={() => { setEditForm({ subject: ticket.subject, priority: ticket.priority, statusId: ticket.status.id, assignedTo: ticket.assignee?.id || '', dueDate: ticket.dueDate ? new Date(ticket.dueDate).toISOString().slice(0, 10) : '' }); setShowEdit(true) }} className="ml-auto p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }}><Pencil className="w-4 h-4" /></motion.button>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-sm">
          <div><span className="text-muted-foreground">Customer:</span> <span className="text-foreground">{ticket.customer.name}</span></div>
          <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{ticket.customer.email}</span></div>
          <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{ticket.customer.phone}</span></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-sm">
          <div><span className="text-muted-foreground">Assigned To:</span> <span className="text-foreground">{ticket.assignee?.fullName || 'Unassigned'}</span></div>
          <div><span className="text-muted-foreground">Due Date:</span> <span className="text-foreground">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '-'}</span></div>
          <div><span className="text-muted-foreground">Created:</span> <span className="text-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
        </div>
      </div>

      {ticket.description && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
        </div>
      )}

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showEdit && (
          <motion.form onSubmit={handleEdit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Edit Ticket</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Subject" value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Status</label><select value={editForm.statusId} onChange={e => setEditForm({ ...editForm, statusId: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background">{statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Priority</label><select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Due Date</label><input type="date" value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background" /></div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Save</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Comments ({ticket.comments.length})</h3>
        <motion.form onSubmit={handleComment} className="flex gap-2 mb-4">
          <input type="text" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} className="flex-1 px-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          <button type="submit" disabled={saving || !comment.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2"><Send className="w-4 h-4" /></button>
        </motion.form>
        <div className="space-y-3">
          {ticket.comments.map(c => (
            <div key={c.id} className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className="font-medium text-foreground">{c.user?.fullName || 'Unknown'}</span>
                <span>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm">{c.body}</p>
            </div>
          ))}
          {ticket.comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>}
        </div>
      </div>
    </div>
  )
}