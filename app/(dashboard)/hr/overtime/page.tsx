'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Loader2, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface OTRecord { id: string; employeeId: string; date: string; hours: number; rate: number; amount: number; approved: boolean; employee: { id: string; name: string } }

const columns = [
  { key: 'employee' as const, label: 'Employee', sortable: true, render: (v: OTRecord['employee']) => <span className="font-medium">{v?.name || '-'}</span> },
  { key: 'date' as const, label: 'Date', sortable: true, render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
  { key: 'hours' as const, label: 'Hours', sortable: true },
  { key: 'rate' as const, label: 'Rate' },
  { key: 'amount' as const, label: 'Amount', sortable: true, render: (v: number) => v.toLocaleString() },
  { key: 'approved' as const, label: 'Status', render: (v: boolean) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v ? 'Approved' : 'Pending'}</span> },
]

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function OvertimePage() {
  const [records, setRecords] = useState<OTRecord[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1))
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], hours: '1' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ month: filterMonth, year: filterYear })
      const [oRes, eRes] = await Promise.all([fetch(`/api/hr/overtime?${params}`), fetch('/api/hr/employees')])
      const oData = await oRes.json(); const eData = await eRes.json()
      setRecords(oData.overtimes || []); setEmployees(eData.employees || [])
    } catch { setError('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterMonth, filterYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/hr/overtime', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      setShowForm(false); fetchData()
    } catch { setError('Failed to create') } finally { setSaving(false) }
  }

  const handleApprove = async (id: string) => {
    try { await fetch(`/api/hr/overtime/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved: true }) }); fetchData() }
    catch { setError('Failed to approve') }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return
    try { await fetch(`/api/hr/overtime/${id}`, { method: 'DELETE' }); fetchData() }
    catch { setError('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Overtime</h1><p className="text-muted-foreground mt-1">Track and approve overtime hours</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg"><Plus className="w-4 h-4" /> Add OT</button>
      </motion.div>

      <div className="flex gap-3">
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background">{months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background">{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
      </div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

      {showForm && <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border rounded-xl p-4 overflow-hidden">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="">Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="number" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="Hours" required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-border rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">{saving && <Loader2 className="w-3 h-3 animate-spin" />}Save</button>
        </div>
      </motion.form>}

      {loading ? <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      : <DataTable columns={columns} data={records} title="Overtime Records" actions={(row) => {
        const r = row as OTRecord
        return <div className="flex items-center gap-1">
          {!r.approved && <button onClick={() => handleApprove(r.id)} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg"><CheckCircle className="w-4 h-4" /></button>}
          <button onClick={() => handleDelete(r.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg"><Trash2 className="w-4 h-4" /></button>
        </div>
      }} />}
    </div>
  )
}
