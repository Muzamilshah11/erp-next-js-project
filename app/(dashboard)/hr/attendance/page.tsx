'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Search, X, Loader2, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AttendanceRecord { id: string; employeeId: string; date: string; timeIn: string | null; timeOut: string | null; status: string; hoursWorked: number; overtimeHours: number; source: string; employee: { id: string; name: string; employeeNo: string | null } }

const statusColors: Record<string, string> = { present: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', absent: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', 'half-day': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' }

const columns = [
  { key: 'employee' as const, label: 'Employee', sortable: true, render: (v: AttendanceRecord['employee']) => <span className="font-medium">{v?.name || '-'}</span> },
  { key: 'date' as const, label: 'Date', sortable: true, render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
  { key: 'timeIn' as const, label: 'In', render: (v: string | null) => v || '-' },
  { key: 'timeOut' as const, label: 'Out', render: (v: string | null) => v || '-' },
  { key: 'status' as const, label: 'Status', render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[v] || statusColors.absent}`}>{v}</span> },
  { key: 'hoursWorked' as const, label: 'Hours', sortable: true },
  { key: 'overtimeHours' as const, label: 'OT', sortable: true },
]

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1))
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [filterEmployee, setFilterEmployee] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], timeIn: '09:00', timeOut: '18:00', status: 'present', hoursWorked: '9', overtimeHours: '0' })
  const [saving, setSaving] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importResult, setImportResult] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ month: filterMonth, year: filterYear })
      if (filterEmployee) params.set('employeeId', filterEmployee)
      const [aRes, eRes] = await Promise.all([fetch(`/api/hr/attendance?${params}`), fetch('/api/hr/employees')])
      const aData = await aRes.json(); const eData = await eRes.json()
      if (!aRes.ok) throw new Error(aData.error || 'Failed')
      setRecords(aData.attendance || [])
      setEmployees(eData.employees || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterMonth, filterYear, filterEmployee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/hr/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      setShowForm(false); setForm({ employeeId: '', date: new Date().toISOString().split('T')[0], timeIn: '09:00', timeOut: '18:00', status: 'present', hoursWorked: '9', overtimeHours: '0' })
      fetchData()
    } catch { setError('Failed to create') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this record?')) return
    try { await fetch(`/api/hr/attendance/${id}`, { method: 'DELETE' }); fetchData() }
    catch { setError('Failed to delete') }
  }

  const handleImport = async () => {
    if (!csvText.trim()) return
    setSaving(true); setImportResult(null)
    try {
      const lines = csvText.trim().split('\n').slice(1)
      const records = lines.map(l => { const c = l.split(','); return { employeeNo: c[0]?.trim(), date: c[1]?.trim(), timeIn: c[2]?.trim(), timeOut: c[3]?.trim(), status: c[4]?.trim() || 'present' } }).filter(r => r.employeeNo && r.date)
      const res = await fetch('/api/hr/attendance/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records }) })
      const data = await res.json()
      setImportResult(`Imported: ${data.imported}, Skipped: ${data.skipped}`)
      setCsvText(''); fetchData()
    } catch { setError('Import failed') }
    finally { setSaving(false) }
  }

  const present = records.filter(r => r.status === 'present').length
  const total = records.length

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Attendance</h1><p className="text-muted-foreground mt-1">Manage employee attendance records</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg"><Plus className="w-4 h-4" /> Add Record</button>
      </motion.div>

      {total > 0 && <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-muted-foreground">Present</p><p className="text-xl font-bold text-green-600">{present}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-muted-foreground">Absent</p><p className="text-xl font-bold text-red-600">{total - present}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-muted-foreground">Attendance %</p><p className="text-xl font-bold text-primary">{total ? Math.round(present / total * 100) : 0}%</p></div>
      </div>}

      <div className="flex gap-3 flex-wrap">
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background">{months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background">{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="">All Employees</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
      </div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

      {showForm && <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border rounded-xl p-4 overflow-hidden">
        <h3 className="text-sm font-semibold mb-3">Manual Attendance Entry</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="half-day">Half Day</option></select>
          <input type="time" value={form.timeIn} onChange={e => setForm({ ...form, timeIn: e.target.value })} className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="time" value={form.timeOut} onChange={e => setForm({ ...form, timeOut: e.target.value })} className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="number" value={form.hoursWorked} onChange={e => setForm({ ...form, hoursWorked: e.target.value })} placeholder="Hours" className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-border rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">{saving && <Loader2 className="w-3 h-3 animate-spin" />}Save</button>
        </div>
      </motion.form>}

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Upload className="w-4 h-4" /> CSV Import</h3>
        <p className="text-xs text-muted-foreground mb-2">CSV format: EmployeeNo, Date, TimeIn, TimeOut, Status</p>
        <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={3} placeholder={`EMP-0001,2024-01-15,09:00,18:00,present\nEMP-0002,2024-01-15,,,absent`} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background mb-2" />
        <button onClick={handleImport} disabled={saving || !csvText.trim()} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-sm disabled:opacity-50">{saving ? 'Importing...' : 'Import CSV'}</button>
        {importResult && <p className="text-sm text-green-600 mt-1">{importResult}</p>}
      </div>

      {loading ? <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      : <DataTable columns={columns} data={records} title="Attendance Records" actions={(row) => (
        <button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
      )} />}
    </div>
  )
}
