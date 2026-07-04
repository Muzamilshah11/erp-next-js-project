'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { useState, useEffect } from 'react'
import { Loader2, Search } from 'lucide-react'

interface LoanReport { id: string; loanNo: string; amount: number; totalInstallments: number; paidInstallments: number; remainingAmount: number; installmentAmount: number; status: string; employee: { id: string; name: string; employeeNo: string | null; department: { name: string } | null; designation: { name: string } | null; salary: number }; installments: { month: number; year: number; amount: number; paid: boolean }[] }

interface GratuityReport { id: string; employeeId: string; settlementDate: string; totalYears: number; gratuityAmount: number; paid: boolean; employee: { id: string; name: string; employeeNo: string | null; department: { name: string } | null } }

interface IncrementReport { id: string; employeeId: string; previousSalary: number; newSalary: number; effectiveFrom: string; reason: string | null; employee: { id: string; name: string; employeeNo: string | null; department: { name: string } | null }; approvedBy: { fullName: string } | null }

interface FSReport { id: string; employeeId: string; settlementDate: string; gratuityAmount: number; leaveEncashmentAmount: number; loanRecoveryAmount: number; netAmount: number; paid: boolean; status: string; employee: { id: string; name: string; employeeNo: string | null; department: { name: string } | null } }

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>{label}</button>
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('loans')
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')

  const [loans, setLoans] = useState<LoanReport[]>([])
  const [gratuities, setGratuities] = useState<GratuityReport[]>([])
  const [increments, setIncrements] = useState<IncrementReport[]>([])
  const [settlements, setSettlements] = useState<FSReport[]>([])
  const [searchId, setSearchId] = useState('')
  const [selectedLoan, setSelectedLoan] = useState<LoanReport | null>(null)

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      if (activeTab === 'loans') {
        const res = await fetch('/api/hr/loans'); const data = await res.json()
        setLoans(data.loans || [])
      } else if (activeTab === 'gratuity') {
        const res = await fetch('/api/hr/reports/gratuity'); const data = await res.json()
        setGratuities(data.settlements || [])
      } else if (activeTab === 'increments') {
        const res = await fetch('/api/hr/reports/increments'); const data = await res.json()
        setIncrements(data.increments || [])
      } else if (activeTab === 'settlements') {
        const res = await fetch('/api/hr/reports/final-settlements'); const data = await res.json()
        setSettlements(data.settlements || [])
      }
    } catch { setError('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [activeTab])

  const viewLoanDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/hr/reports/loans/${id}`); const data = await res.json()
      setSelectedLoan(data.loan)
    } catch { setError('Failed') }
  }

  const loanColumns = [
    { key: 'loanNo' as const, label: 'Loan No' },
    { key: 'employee' as const, label: 'Employee', render: (v: LoanReport['employee']) => v?.name || '-' },
    { key: 'amount' as const, label: 'Amount', render: (v: number) => v.toLocaleString() },
    { key: 'remainingAmount' as const, label: 'Remaining', render: (v: number) => <span className="font-semibold text-primary">{v.toLocaleString()}</span> },
    { key: 'status' as const, label: 'Status', render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${v === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{v}</span> },
  ]

  const gratuityColumns = [
    { key: 'employee' as const, label: 'Employee', render: (v: GratuityReport['employee']) => v?.name || '-' },
    { key: 'settlementDate' as const, label: 'Date', render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
    { key: 'totalYears' as const, label: 'Years' },
    { key: 'gratuityAmount' as const, label: 'Amount', render: (v: number) => <span className="font-bold text-primary">{v.toLocaleString()}</span> },
    { key: 'paid' as const, label: 'Status', render: (v: boolean) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v ? 'Paid' : 'Pending'}</span> },
  ]

  const incrementColumns = [
    { key: 'employee' as const, label: 'Employee', render: (v: IncrementReport['employee']) => v?.name || '-' },
    { key: 'previousSalary' as const, label: 'Previous', render: (v: number) => v.toLocaleString() },
    { key: 'newSalary' as const, label: 'New', render: (v: number) => <span className="font-bold text-green-600">{v.toLocaleString()}</span> },
    { key: 'effectiveFrom' as const, label: 'Effective', render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
    { key: 'approvedBy' as const, label: 'Approved By', render: (v: { fullName: string } | null) => v?.fullName || '-' },
  ]

  const fsColumns = [
    { key: 'employee' as const, label: 'Employee', render: (v: FSReport['employee']) => v?.name || '-' },
    { key: 'settlementDate' as const, label: 'Date', render: (v: string) => new Date(v).toLocaleDateString('en-PK') },
    { key: 'netAmount' as const, label: 'Net Amount', render: (v: number) => <span className="font-bold text-primary">{v.toLocaleString()}</span> },
    { key: 'status' as const, label: 'Status', render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${v === 'settled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v}</span> },
  ]

  const totalGratuity = gratuities.reduce((s, g) => s + g.gratuityAmount, 0)
  const totalSettlements = settlements.reduce((s, fs) => s + fs.netAmount, 0)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">HR Reports</h1>
        <p className="text-muted-foreground mt-1">Loan, Gratuity, Increment, and Final Settlement inquiries</p>
      </motion.div>

      <div className="flex gap-2 flex-wrap border-b border-border pb-2">
        <Tab label="Loan Inquiry" active={activeTab === 'loans'} onClick={() => { setActiveTab('loans'); setSelectedLoan(null) }} />
        <Tab label="Gratuity Report" active={activeTab === 'gratuity'} onClick={() => setActiveTab('gratuity')} />
        <Tab label="Increment Report" active={activeTab === 'increments'} onClick={() => setActiveTab('increments')} />
        <Tab label="Final Settlements" active={activeTab === 'settlements'} onClick={() => setActiveTab('settlements')} />
      </div>

      {activeTab === 'gratuity' && gratuities.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 text-sm">
          Total Gratuity Paid: <span className="font-bold text-primary">{totalGratuity.toLocaleString()}</span> | Count: {gratuities.length}
        </div>
      )}

      {activeTab === 'settlements' && settlements.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 text-sm">
          Total Settlement Amount: <span className="font-bold text-primary">{totalSettlements.toLocaleString()}</span> | Count: {settlements.length}
        </div>
      )}

      {activeTab === 'loans' && selectedLoan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{selectedLoan.loanNo} — {selectedLoan.employee.name}</h3>
            <button onClick={() => setSelectedLoan(null)} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
            <div><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">{selectedLoan.amount.toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Paid:</span> <span className="font-semibold">{selectedLoan.paidInstallments}/{selectedLoan.totalInstallments}</span></div>
            <div><span className="text-muted-foreground">Remaining:</span> <span className="font-semibold text-primary">{selectedLoan.remainingAmount.toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Department:</span> <span>{selectedLoan.employee.department?.name || '-'}</span></div>
            <div><span className="text-muted-foreground">Designation:</span> <span>{selectedLoan.employee.designation?.name || '-'}</span></div>
            <div><span className="text-muted-foreground">Salary:</span> <span>{selectedLoan.employee.salary.toLocaleString()}</span></div>
          </div>
          <h4 className="text-sm font-semibold mb-2">Installment Schedule</h4>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border"><th className="text-left px-3 py-2 text-muted-foreground">#</th><th className="text-left px-3 py-2 text-muted-foreground">Period</th><th className="text-right px-3 py-2 text-muted-foreground">Amount</th><th className="text-center px-3 py-2 text-muted-foreground">Status</th></tr></thead>
            <tbody>{selectedLoan.installments.map((inst, i) => (
              <tr key={i} className="border-b border-border"><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2">{inst.month}/{inst.year}</td><td className="px-3 py-2 text-right">{inst.amount.toLocaleString()}</td><td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded text-xs ${inst.paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inst.paid ? 'Paid' : 'Pending'}</span></td></tr>
            ))}</tbody>
          </table>
        </motion.div>
      )}

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

      {loading ? <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      : <>
        {activeTab === 'loans' && <DataTable columns={loanColumns as typeof loanColumns} data={loans} title="Loan Inquiry"
          actions={(row: Record<string, unknown>) => <button onClick={() => viewLoanDetail(row.id as string)} className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20">View Detail</button>}
        />}
        {activeTab === 'gratuity' && <DataTable columns={gratuityColumns as typeof gratuityColumns} data={gratuities} title="Gratuity Report" />}
        {activeTab === 'increments' && <DataTable columns={incrementColumns as typeof incrementColumns} data={increments} title="Increment Report" />}
        {activeTab === 'settlements' && <DataTable columns={fsColumns as typeof fsColumns} data={settlements} title="Final Settlements" />}
      </>}
    </div>
  )
}
