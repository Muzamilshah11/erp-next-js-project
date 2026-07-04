'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface LeaveRecord { id: string; employeeId: string; leaveTypeId: string; startDate: string; endDate: string; days: number; reason: string | null; status: string; employee: { id: string; name: string; employeeNo: string | null }; leaveType: { id: string; name: string; daysPerYear: number }; approvedBy: { id: string; fullName: string } | null }

const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', approved: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }

const columns = [
  { key: 'employee' as const, label: 'Employee', sortable: true, render: (v: LeaveRecord['employee']) => <span className="font-medium">{v?.name || '-'}</span> },
  { key: 'leaveType' as const, label: 'Leave Type', render: (v: LeaveRecord['leaveType']) => <span className="font-medium">{v?.name || '-'}</span> },
  { key: 'startDate' as const, label: 'From', sortable: true, render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
  { key: 'endDate' as const, label: 'To', render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
  { key: 'days' as const, label: 'Days', sortable: true },
  { key: 'reason' as const, label: 'Reason', render: (v: string | null) => v || '-' },
  { key: 'status' as const, label: 'Status', render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[v] || ''}`}>{v}</span> },
]

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string; employeeNo: string | null }[]>([])
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string; daysPerYear: number }[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      const [lRes, eRes, ltRes] = await Promise.all([
        fetch(`/api/hr/leaves?${params}`), fetch('/api/hr/employees'), fetch('/api/hr/setup/leave-types'),
      ])
      const lData = await lRes.json(); const eData = await eRes.json(); const ltData = await ltRes.json()
      setLeaves(lData.leaves || [])
      setEmployees(eData.employees || [])
      setLeaveTypes(ltData.leaveTypes || [])
    } catch { setError('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/hr/leaves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      setShowForm(false); setForm({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' })
      fetchData()
    } catch { setError('Failed to apply') } finally { setSaving(false) }
  }

  const handleApprove = async (id: string, status: string) => {
    try {
      await fetch(`/api/hr/leaves/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      fetchData()
    } catch { setError('Failed to update') }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this leave?')) return
    try { await fetch(`/api/hr/leaves/${id}`, { method: 'DELETE' }); fetchData() }
    catch { setError('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Leave Management</h1><p className="text-muted-foreground mt-1">Apply, approve, and track employee leaves</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg"><Plus className="w-4 h-4" /> Apply Leave</button>
      </motion.div>

      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background">
        <option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
      </select>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

      {showForm && <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border rounded-xl p-4 overflow-hidden">
        <h3 className="text-sm font-semibold mb-3">Apply for Leave</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <select value={form.leaveTypeId} onChange={e => setForm({ ...form, leaveTypeId: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="">Leave Type</option>{leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({lt.daysPerYear} days)</option>)}</select>
          <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="text" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason" className="px-3 py-2 border border-input rounded-lg text-sm bg-background col-span-2" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-border rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">{saving && <Loader2 className="w-3 h-3 animate-spin" />}Submit</button>
        </div>
      </motion.form>}

      {loading ? <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      : <DataTable columns={columns} data={leaves} title="Leave Applications" actions={(row) => {
        const l = row as LeaveRecord
        return <div className="flex items-center gap-1">
          {l.status === 'pending' && <><button onClick={() => handleApprove(l.id, 'approved')} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg" title="Approve"><CheckCircle className="w-4 h-4" /></button><button onClick={() => handleApprove(l.id, 'rejected')} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg" title="Reject"><XCircle className="w-4 h-4" /></button></>}
          {l.status === 'pending' && <button onClick={() => handleDelete(l.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg"><Trash2 className="w-4 h-4" /></button>}
        </div>
      }} />}
    </div>
  )
}
