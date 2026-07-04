'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Calculator, Loader2, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Settlement { id: string; employeeId: string; settlementDate: string; totalYears: number; gratuityAmount: number; paid: boolean; paidAt: string | null; status: string; employee: { id: string; name: string; employeeNo: string | null } }

const columns = [
  { key: 'employee' as const, label: 'Employee', render: (v: Settlement['employee']) => <span className="font-medium">{v?.name || '-'}</span> },
  { key: 'settlementDate' as const, label: 'Date', render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
  { key: 'totalYears' as const, label: 'Years', sortable: true },
  { key: 'gratuityAmount' as const, label: 'Amount', sortable: true, render: (v: number) => <span className="font-bold text-primary">{v.toLocaleString()}</span> },
  { key: 'paid' as const, label: 'Status', render: (v: boolean) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v ? 'Paid' : 'Pending'}</span> },
]

export default function GratuityPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string; joinDate: string; salary: number }[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [calcResult, setCalcResult] = useState<{ totalYears: number; gratuityAmount: number; basicDaily: number; basicSalary: number } | null>(null)
  const [form, setForm] = useState({ employeeId: '', settlementDate: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sRes, eRes] = await Promise.all([fetch('/api/hr/gratuity'), fetch('/api/hr/employees')])
      const sData = await sRes.json(); const eData = await eRes.json()
      setSettlements(sData.settlements || []); setEmployees(eData.employees || [])
    } catch { setError('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleCalculate = async () => {
    if (!form.employeeId || !form.settlementDate) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/hr/gratuity/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setCalcResult(data)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const handleSettle = async () => {
    if (!calcResult || !form.employeeId) return
    setSaving(true)
    try {
      const res = await fetch('/api/hr/gratuity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: form.employeeId, settlementDate: form.settlementDate, totalYears: calcResult.totalYears, gratuityAmount: calcResult.gratuityAmount }) })
      if (!res.ok) throw new Error('Failed')
      setCalcResult(null); fetchData()
    } catch { setError('Failed to settle') } finally { setSaving(false) }
  }

  const handleMarkPaid = async (id: string) => {
    try { await fetch(`/api/hr/gratuity/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paid: true }) }); fetchData() }
    catch { setError('Failed') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Gratuity</h1>
        <p className="text-muted-foreground mt-1">Calculate and settle gratuity payments</p>
      </motion.div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Calculator className="w-4 h-4" /> Gratuity Calculator</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <input type="date" value={form.settlementDate} onChange={e => setForm({ ...form, settlementDate: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
        </div>
        <button onClick={handleCalculate} disabled={saving || !form.employeeId} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />} Calculate
        </button>

        {calcResult && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Service Years</span><span className="font-semibold">{calcResult.totalYears}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Basic Salary</span><span className="font-semibold">{calcResult.basicSalary.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Daily Basic</span><span className="font-semibold">{calcResult.basicDaily.toFixed(2)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-base"><span className="font-semibold">Estimated Gratuity</span><span className="font-bold text-primary text-lg">{calcResult.gratuityAmount.toLocaleString()}</span></div>
          <button onClick={handleSettle} disabled={saving} className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Record Settlement
          </button>
        </motion.div>}
      </div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

      {loading ? <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      : <DataTable columns={columns} data={settlements} title="Gratuity Settlements" actions={(row) => {
        const s = row as Settlement
        return !s.paid ? <button onClick={() => handleMarkPaid(s.id)} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg"><CheckCircle className="w-4 h-4" /></button> : null
      }} />}
    </div>
  )
}
