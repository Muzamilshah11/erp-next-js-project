'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Loader2, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'

interface LoanRecord { id: string; employeeId: string; loanNo: string; amount: number; totalInstallments: number; paidInstallments: number; remainingAmount: number; installmentAmount: number; status: string; purpose: string | null; employee: { id: string; name: string; employeeNo: string | null } }

const columns = [
  { key: 'loanNo' as const, label: 'Loan No', sortable: true },
  { key: 'employee' as const, label: 'Employee', sortable: true, render: (v: LoanRecord['employee']) => <span className="font-medium">{v?.name || '-'}</span> },
  { key: 'amount' as const, label: 'Amount', sortable: true, render: (v: number) => v.toLocaleString() },
  { key: 'installmentAmount' as const, label: 'Monthly Inst.', render: (v: number) => v.toLocaleString() },
  { key: 'paidInstallments' as const, label: 'Paid', render: (_v: unknown, row: LoanRecord) => `${row.paidInstallments}/${row.totalInstallments}` },
  { key: 'remainingAmount' as const, label: 'Remaining', sortable: true, render: (v: number) => <span className="font-semibold text-primary">{v.toLocaleString()}</span> },
  { key: 'status' as const, label: 'Status', render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${v === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>{v}</span> },
]

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false); const [showDetail, setShowDetail] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ loan: LoanRecord; installments: { id: string; month: number; year: number; amount: number; paid: boolean; paidAt: string | null }[] } | null>(null)
  const [form, setForm] = useState({ employeeId: '', amount: '', totalInstallments: '12', purpose: '', approvalDate: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [lRes, eRes] = await Promise.all([fetch('/api/hr/loans'), fetch('/api/hr/employees')])
      const lData = await lRes.json(); const eData = await eRes.json()
      setLoans(lData.loans || []); setEmployees(eData.employees || [])
    } catch { setError('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/hr/loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      setShowForm(false); setForm({ employeeId: '', amount: '', totalInstallments: '12', purpose: '', approvalDate: '' }); fetchData()
    } catch { setError('Failed to create') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this loan?')) return
    try { await fetch(`/api/hr/loans/${id}`, { method: 'DELETE' }); fetchData() }
    catch { setError('Failed to delete') }
  }

  const viewDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/hr/loans/${id}`)
      const data = await res.json()
      setDetail(data.loan); setShowDetail(id)
    } catch { setError('Failed to fetch detail') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Employee Loans</h1><p className="text-muted-foreground mt-1">Manage loan applications and installment schedules</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg"><Plus className="w-4 h-4" /> New Loan</button>
      </motion.div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

      {showForm && <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border rounded-xl p-4 overflow-hidden">
        <h3 className="text-sm font-semibold mb-3">New Loan Application</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Loan Amount" required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="number" value={form.totalInstallments} onChange={e => setForm({ ...form, totalInstallments: e.target.value })} placeholder="Total Installments" required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="date" value={form.approvalDate} onChange={e => setForm({ ...form, approvalDate: e.target.value })} className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="text" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Purpose" className="px-3 py-2 border border-input rounded-lg text-sm bg-background col-span-2" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-border rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">{saving && <Loader2 className="w-3 h-3 animate-spin" />}Create</button>
        </div>
      </motion.form>}

      {showDetail && detail && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{detail.loan.loanNo} — Installment Schedule</h3>
          <button onClick={() => { setShowDetail(null); setDetail(null) }} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border"><th className="text-left px-3 py-2 text-muted-foreground">#</th><th className="text-left px-3 py-2 text-muted-foreground">Month</th><th className="text-right px-3 py-2 text-muted-foreground">Amount</th><th className="text-center px-3 py-2 text-muted-foreground">Status</th></tr></thead>
          <tbody>
            {detail.installments.map((inst, i) => (
              <tr key={inst.id} className="border-b border-border"><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2">{inst.month}/{inst.year}</td><td className="px-3 py-2 text-right">{inst.amount.toLocaleString()}</td><td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded text-xs ${inst.paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inst.paid ? 'Paid' : 'Pending'}</span></td></tr>
            ))}
          </tbody>
        </table>
      </motion.div>}

      {loading ? <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      : <DataTable columns={columns} data={loans} title="Loans" actions={(row) => <div className="flex items-center gap-1">
        <button onClick={() => viewDetail(row.id)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"><Eye className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg"><Trash2 className="w-4 h-4" /></button>
      </div>} />}
    </div>
  )
}
