'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Trash2, Search, X, Loader2, Download, CheckCircle, Wallet, Users, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Employee { id: string; name: string; department: { name: string } | null; designation: { name: string } | null }
interface PayrollEntry {
  id: string; employeeId: string; month: number; year: number
  basicSalary: number; totalAllowances: number; totalDeductions: number
  grossPay: number; netPay: number; status: string
  paidAt: string | null; paymentMethod: string | null; remarks: string | null
  employee: Employee
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const statusConfig: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

const columns = [
  { key: 'employee' as const, label: 'Employee', sortable: true,
    render: (v: Employee) => (
      <div>
        <span className="font-medium">{v?.name || '-'}</span>
        <span className="text-xs text-muted-foreground block">{v?.department?.name || ''}</span>
      </div>
    ),
  },
  { key: 'month' as const, label: 'Period', sortable: true,
    render: (_v: unknown, row: PayrollEntry) => <span className="font-medium">{months[row.month - 1]} {row.year}</span>,
  },
  { key: 'basicSalary' as const, label: 'Basic', sortable: true,
    render: (v: number) => v.toLocaleString(),
  },
  { key: 'grossPay' as const, label: 'Gross', sortable: true,
    render: (v: number) => <span className="font-semibold text-green-600">{v.toLocaleString()}</span>,
  },
  { key: 'netPay' as const, label: 'Net Pay', sortable: true,
    render: (v: number) => <span className="font-bold text-primary">{v.toLocaleString()}</span>,
  },
  { key: 'status' as const, label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[value] || statusConfig.pending}`}>{value}</span>
    ),
  },
  { key: 'paidAt' as const, label: 'Paid Date',
    render: (v: string | null) => v ? new Date(v).toLocaleDateString('en-PK') : '-',
  },
]

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1))
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (filterMonth) params.set('month', filterMonth)
      if (filterYear) params.set('year', filterYear)
      if (filterStatus) params.set('status', filterStatus)
      if (filterEmployee) params.set('employeeId', filterEmployee)

      const [pRes, eRes] = await Promise.all([fetch(`/api/hr/payroll?${params}`), fetch('/api/hr/employees')])
      const pData = await pRes.json(); const eData = await eRes.json()
      if (!pRes.ok) throw new Error(pData.error || 'Failed')
      setPayrolls(pData.payrolls || [])
      setEmployees(eData.employees || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterMonth, filterYear, filterStatus, filterEmployee])

  const handleGenerate = async () => {
    if (!window.confirm(`Generate payroll for ${months[parseInt(filterMonth) - 1]} ${filterYear} for all active employees?`)) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/hr/payroll/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month: filterMonth, year: filterYear }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      fetchData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to generate') }
    finally { setSaving(false) }
  }

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/hr/payroll/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'paid', paymentMethod: 'bank-transfer' }) })
      if (!res.ok) throw new Error(); fetchData()
    } catch { setError('Failed to mark as paid') }
  }

  const handleBulkPaid = async () => {
    if (!selected.size) return
    if (!window.confirm(`Mark ${selected.size} payrolls as paid?`)) return
    setSaving(true)
    try {
      const res = await fetch('/api/hr/payroll/bulk-paid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selected), paymentMethod: 'bank-transfer' }) })
      if (!res.ok) throw new Error()
      setSelected(new Set()); fetchData()
    } catch { setError('Failed to bulk mark paid') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this payroll entry?')) return
    try { const res = await fetch(`/api/hr/payroll/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); fetchData() }
    catch { setError('Failed to delete') }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const now = new Date()
  const currentMonthPayrolls = payrolls.filter(p => p.month === (now.getMonth() + 1) && p.year === now.getFullYear())
  const totalPending = currentMonthPayrolls.filter(p => p.status === 'pending').reduce((s, p) => s + p.netPay, 0)
  const totalPaid = currentMonthPayrolls.filter(p => p.status === 'paid').reduce((s, p) => s + p.netPay, 0)
  const pendingCount = currentMonthPayrolls.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Wallet className="w-8 h-8 text-primary" /> Payroll</h1>
          <p className="text-muted-foreground mt-1">Manage employee salaries and payments</p>
        </div>
        <div className="flex gap-2">
          <motion.button onClick={handleGenerate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate {months[parseInt(filterMonth) - 1]}
          </motion.button>
          {selected.size > 0 && (
            <motion.button onClick={handleBulkPaid} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:shadow-lg disabled:opacity-50" initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle className="w-4 h-4" /> Mark Paid ({selected.size})
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard2 label="Current Month" value={`${months[now.getMonth()]} ${now.getFullYear()}`} icon={<Clock className="w-5 h-5" />} color="blue" />
        <SummaryCard2 label="Total Payroll" value={currentMonthPayrolls.reduce((s, p) => s + p.netPay, 0).toLocaleString()} icon={<Wallet className="w-5 h-5" />} color="purple" />
        <SummaryCard2 label="Pending Payment" value={totalPending.toLocaleString()} icon={<Users className="w-5 h-5" />} color="amber" subtitle={`${pendingCount} employees`} />
        <SummaryCard2 label="Paid" value={totalPaid.toLocaleString()} icon={<CheckCircle className="w-5 h-5" />} color="green" />
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 flex-wrap">
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading payroll...</p></div>
      ) : (
        <DataTable columns={columns} data={payrolls.filter(p => !search || p.employee?.name?.toLowerCase().includes(search.toLowerCase()))} title="Payroll Entries"
          selectable={{ selected, onToggle: toggleSelect }}
          emptyMessage={`No payroll entries found for ${months[parseInt(filterMonth) - 1]} ${filterYear}. Click "Generate ${months[parseInt(filterMonth) - 1]}" button above to create payroll for all active employees.`}
          actions={(row) => {
            const entry = row as PayrollEntry
            return (
              <div className="flex items-center gap-1">
                {entry.status === 'pending' && (
                  <motion.button onClick={() => handleMarkPaid(entry.id)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Mark Paid"><CheckCircle className="w-4 h-4" /></motion.button>
                )}
                <motion.button onClick={() => window.open(`/api/hr/payroll/${entry.id}/payslip`, '_blank')} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" whileHover={{ scale: 1.1 }} title="Payslip"><Download className="w-4 h-4" /></motion.button>
                {entry.status === 'pending' && (
                  <motion.button onClick={() => handleDelete(entry.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
                )}
              </div>
            )
          }}
        />
      )}
    </div>
  )
}

function SummaryCard2({ label, value, icon, color, subtitle }: { label: string; value: string; icon: React.ReactNode; color: string; subtitle?: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30',
    amber: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/30',
  }
  return (
    <motion.div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="text-muted-foreground/70">{icon}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  )
}