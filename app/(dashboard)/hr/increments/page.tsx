'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface IncrementRecord { id: string; employeeId: string; previousSalary: number; newSalary: number; effectiveFrom: string; reason: string | null; employee: { id: string; name: string }; approvedBy: { id: string; fullName: string } | null }

const columns = [
  { key: 'employee' as const, label: 'Employee', sortable: true, render: (v: IncrementRecord['employee']) => <span className="font-medium">{v?.name || '-'}</span> },
  { key: 'previousSalary' as const, label: 'Previous', sortable: true, render: (v: number) => v.toLocaleString() },
  { key: 'newSalary' as const, label: 'New Salary', sortable: true, render: (v: number) => <span className="font-bold text-green-600">{v.toLocaleString()}</span> },
  { key: 'effectiveFrom' as const, label: 'Effective', render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
  { key: 'reason' as const, label: 'Reason', render: (v: string | null) => v || '-' },
]

export default function IncrementsPage() {
  const [increments, setIncrements] = useState<IncrementRecord[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string; salary: number }[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ employeeId: '', newSalary: '', effectiveFrom: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [iRes, eRes] = await Promise.all([fetch('/api/hr/increments'), fetch('/api/hr/employees')])
      const iData = await iRes.json(); const eData = await eRes.json()
      setIncrements(iData.increments || []); setEmployees(eData.employees || [])
    } catch { setError('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/hr/increments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      setShowForm(false); fetchData()
    } catch { setError('Failed to create') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Salary Increments</h1><p className="text-muted-foreground mt-1">Track employee salary increases</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg"><Plus className="w-4 h-4" /> New Increment</button>
      </motion.div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

      {showForm && <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border rounded-xl p-4 overflow-hidden">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name} (Current: {e.salary.toLocaleString()})</option>)}</select>
          <input type="number" value={form.newSalary} onChange={e => setForm({ ...form, newSalary: e.target.value })} placeholder="New Salary" required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="date" value={form.effectiveFrom} onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="text" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason" className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-border rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">{saving && <Loader2 className="w-3 h-3 animate-spin" />}Save</button>
        </div>
      </motion.form>}

      {loading ? <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      : <DataTable columns={columns} data={increments} title="Increment History" />}
    </div>
  )
}
