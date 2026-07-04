'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Loader2, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface FSRecord { id: string; employeeId: string; settlementDate: string; gratuityAmount: number; leaveEncashmentAmount: number; loanRecoveryAmount: number; otherDeductions: number; netAmount: number; paid: boolean; paidAt: string | null; status: string; employee: { id: string; name: string; employeeNo: string | null } }

const columns = [
  { key: 'employee' as const, label: 'Employee', render: (v: FSRecord['employee']) => <span className="font-medium">{v?.name || '-'}</span> },
  { key: 'settlementDate' as const, label: 'Date', render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
  { key: 'gratuityAmount' as const, label: 'Gratuity', render: (v: number) => v.toLocaleString() },
  { key: 'netAmount' as const, label: 'Net Amount', sortable: true, render: (v: number) => <span className="font-bold text-primary">{v.toLocaleString()}</span> },
  { key: 'status' as const, label: 'Status', render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${v === 'settled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v}</span> },
]

export default function FinalSettlementPage() {
  const [settlements, setSettlements] = useState<FSRecord[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string; joinDate: string; salary: number }[]>([])
  const [loans, setLoans] = useState<{ id: string; employeeId: string; remainingAmount: number; installmentAmount: number }[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ employeeId: '', settlementDate: new Date().toISOString().split('T')[0], gratuityAmount: '0', leaveEncashmentAmount: '0', loanRecoveryAmount: '0', otherDeductions: '0' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [fsRes, eRes, lRes] = await Promise.all([fetch('/api/hr/final-settlement'), fetch('/api/hr/employees'), fetch('/api/hr/loans')])
      const fsData = await fsRes.json(); const eData = await eRes.json(); const lData = await lRes.json()
      setSettlements(fsData.settlements || []); setEmployees(eData.employees || []); setLoans(lData.loans || [])
    } catch { setError('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleEmployeeChange = (empId: string) => {
    setForm(prev => ({ ...prev, employeeId: empId }))
    const emp = employees.find(e => e.id === empId)
    if (emp) {
      const basicDaily = emp.salary / 26
      const joinDate = new Date(emp.joinDate)
      const settlementDate = new Date(form.settlementDate)
      const years = (settlementDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      const gratuityAmount = years <= 5 ? basicDaily * 21 * years : basicDaily * (21 * 5 + 41 * (years - 5))
      const empLoan = loans.find(l => l.employeeId === empId && l.remainingAmount > 0)
      setForm(prev => ({ ...prev, gratuityAmount: String(Math.round(gratuityAmount)), loanRecoveryAmount: String(empLoan?.remainingAmount || 0) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/hr/final-settlement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      setShowForm(false); fetchData()
    } catch { setError('Failed to create') } finally { setSaving(false) }
  }

  const handleSettle = async (id: string) => {
    try { await fetch(`/api/hr/final-settlement/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'settled', paid: true }) }); fetchData() }
    catch { setError('Failed') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Final Settlement</h1><p className="text-muted-foreground mt-1">Process employee final settlements including gratuity, leave encashment, and loan recovery</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg"><Plus className="w-4 h-4" /> New Settlement</button>
      </motion.div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

      {showForm && <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border rounded-xl p-4 overflow-hidden">
        <h3 className="text-sm font-semibold mb-3">Create Final Settlement</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select value={form.employeeId} onChange={e => handleEmployeeChange(e.target.value)} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <input type="date" value={form.settlementDate} onChange={e => setForm({ ...form, settlementDate: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="number" value={form.gratuityAmount} onChange={e => setForm({ ...form, gratuityAmount: e.target.value })} placeholder="Gratuity Amount" className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="number" value={form.leaveEncashmentAmount} onChange={e => setForm({ ...form, leaveEncashmentAmount: e.target.value })} placeholder="Leave Encashment" className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="number" value={form.loanRecoveryAmount} onChange={e => setForm({ ...form, loanRecoveryAmount: e.target.value })} placeholder="Loan Recovery" className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="number" value={form.otherDeductions} onChange={e => setForm({ ...form, otherDeductions: e.target.value })} placeholder="Other Deductions" className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
        </div>
        <div className="bg-muted/30 rounded-lg p-3 mb-3 text-sm flex justify-between">
          <span className="font-semibold">Net Amount:</span>
          <span className="font-bold text-primary">{(parseFloat(form.gratuityAmount || '0') + parseFloat(form.leaveEncashmentAmount || '0') - parseFloat(form.loanRecoveryAmount || '0') - parseFloat(form.otherDeductions || '0')).toLocaleString()}</span>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-border rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">{saving && <Loader2 className="w-3 h-3 animate-spin" />}Create</button>
        </div>
      </motion.form>}

      {loading ? <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      : <DataTable columns={columns} data={settlements} title="Final Settlements" actions={(row) => {
        const s = row as FSRecord
        return s.status === 'draft' ? <button onClick={() => handleSettle(s.id)} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg"><CheckCircle className="w-4 h-4" /></button> : null
      }} />}
    </div>
  )
}
