'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Mail, Phone, Trash2, Pencil, Search, X, Loader2, PlusCircle, MinusCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Employee {
  id: string; name: string; email: string; phone: string
  designation: string; department: string; joinDate: string
  salary: number; status: 'active' | 'inactive'
  allowances?: Allowance[]; deductions?: Deduction[]
}
interface Allowance { id: string; type: string; amount: number; employeeId: string }
interface Deduction { id: string; type: string; amount: number; employeeId: string }

const columns = [
  { key: 'name' as const, label: 'Employee Name', sortable: true,
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-bold">{value.charAt(0)}</div>
        <span className="font-medium">{value}</span>
      </div>
    ),
  },
  { key: 'email' as const, label: 'Email',
    render: (value: string) => <span className="flex items-center gap-1 text-sm"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{value}</span>,
  },
  { key: 'phone' as const, label: 'Phone',
    render: (value: string) => <span className="flex items-center gap-1 text-sm"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{value}</span>,
  },
  { key: 'designation' as const, label: 'Designation', sortable: true },
  { key: 'department' as const, label: 'Department', sortable: true,
    render: (value: string) => <span className="px-2 py-1 bg-secondary/50 rounded text-sm font-medium">{value}</span>,
  },
  { key: 'joinDate' as const, label: 'Join Date', sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
  },
  { key: 'salary' as const, label: 'Basic Salary', sortable: true,
    render: (value: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(value),
  },
  { key: 'status' as const, label: 'Status',
    render: (value: string) => (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        value === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
      }`}>{value}</span>
    ),
  },
]

const allowanceTypes = ['house-rent', 'medical', 'transport', 'other']
const deductionTypes = ['tax', 'loan', 'other']

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<Employee | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', designation: '', salary: '', joinDate: '', status: 'active' })
  const [allowances, setAllowances] = useState<{ type: string; amount: string }[]>([])
  const [deductions, setDeductions] = useState<{ type: string; amount: string }[]>([])

  const fetchEmployees = async (q = '') => {
    setLoading(true); setError('')
    try {
      const url = q ? `/api/hr/employees?q=${encodeURIComponent(q)}` : '/api/hr/employees'
      const res = await fetch(url); const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setEmployees(data.employees || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEmployees() }, [])
  useEffect(() => { const t = setTimeout(() => fetchEmployees(search), 300); return () => clearTimeout(t) }, [search])

  const fetchAllowancesDeductions = async (empId: string) => {
    try {
      const [aRes, dRes] = await Promise.all([
        fetch(`/api/hr/allowances`),
        fetch(`/api/hr/deductions`),
      ])
      const aData = await aRes.json(); const dData = await dRes.json()
      const empAllowances = (aData.allowances || []).filter((a: Allowance) => a.employeeId === empId)
      const empDeductions = (dData.deductions || []).filter((d: Deduction) => d.employeeId === empId)
      setAllowances(empAllowances.map((a: Allowance) => ({ type: a.type, amount: String(a.amount) })))
      setDeductions(empDeductions.map((d: Deduction) => ({ type: d.type, amount: String(d.amount) })))
    } catch {
      setAllowances([]); setDeductions([])
    }
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', department: '', designation: '', salary: '', joinDate: new Date().toISOString().split('T')[0], status: 'active' })
    setAllowances([]); setDeductions([])
    setShowForm(true)
  }
  const openEdit = async (emp: Employee) => {
    setEditing(emp)
    setForm({
      name: emp.name, email: emp.email, phone: emp.phone, department: emp.department,
      designation: emp.designation, salary: String(emp.salary),
      joinDate: new Date(emp.joinDate).toISOString().split('T')[0], status: emp.status,
    })
    await fetchAllowancesDeductions(emp.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const body = { ...form, salary: parseFloat(form.salary) || 0 }
      const url = editing ? `/api/hr/employees/${editing.id}` : '/api/hr/employees'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save employee')

      const data = await res.json()
      const empId = editing?.id || data.employee.id

      // Save allowances
      for (const a of allowances) {
        const existing = editing ? (await (await fetch(`/api/hr/allowances`)).json()).allowances.filter((x: Allowance) => x.employeeId === empId) : []
        const match = existing.find((x: Allowance) => x.type === a.type)
        if (match) {
          await fetch(`/api/hr/allowances/${match.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: a.type, amount: parseFloat(a.amount) || 0 }) })
        } else {
          await fetch(`/api/hr/allowances`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: empId, type: a.type, amount: parseFloat(a.amount) || 0 }) })
        }
      }

      // Save deductions
      for (const d of deductions) {
        const existing = editing ? (await (await fetch(`/api/hr/deductions`)).json()).deductions.filter((x: Deduction) => x.employeeId === empId) : []
        const match = existing.find((x: Deduction) => x.type === d.type)
        if (match) {
          await fetch(`/api/hr/deductions/${match.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: d.type, amount: parseFloat(d.amount) || 0 }) })
        } else {
          await fetch(`/api/hr/deductions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: empId, type: d.type, amount: parseFloat(d.amount) || 0 }) })
        }
      }

      setShowForm(false); setEditing(null)
      setForm({ name: '', email: '', phone: '', department: '', designation: '', salary: '', joinDate: '', status: 'active' })
      setAllowances([]); setDeductions([])
      fetchEmployees(search)
    } catch { setError('Failed to save employee') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this employee?')) return
    try { const res = await fetch(`/api/hr/employees/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); fetchEmployees(search) }
    catch { setError('Failed to delete employee') }
  }

  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'active').length
  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0)

  const totalAllowanceAmount = allowances.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0)
  const totalDeductionAmount = deductions.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)
  const basicSalary = parseFloat(form.salary) || 0
  const grossPay = basicSalary + totalAllowanceAmount
  const netPay = grossPay - totalDeductionAmount

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Human Resources</h1>
          <p className="text-muted-foreground mt-1">Manage employees and payroll</p>
        </div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4" /> Add Employee
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Total Employees" value={String(totalEmployees)} color="blue" />
        <SummaryCard label="Active Employees" value={String(activeEmployees)} color="green" />
        <SummaryCard label="Monthly Payroll" value={new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(totalPayroll)} color="purple" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Employee' : 'Add New Employee'}</h3>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select Department</option>
                <option>Finance</option><option>Sales</option><option>Inventory</option><option>HR</option><option>Operations</option>
              </select>
              <input type="text" placeholder="Designation" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="number" placeholder="Basic Salary" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} required className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Allowances */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">Allowances</h4>
              </div>
              <div className="space-y-2">
                {allowanceTypes.map(type => {
                  const a = allowances.find(x => x.type === type)
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="w-28 text-sm capitalize text-muted-foreground">{type.replace('-', ' ')}</span>
                      <input type="number" placeholder="Amount" value={a?.amount || ''} onChange={e => {
                        const updated = [...allowances.filter(x => x.type !== type)]
                        if (e.target.value) updated.push({ type, amount: e.target.value })
                        setAllowances(updated)
                      }} className="flex-1 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  )
                })}
                <div className="flex justify-end text-sm font-medium text-foreground pt-1 border-t border-border">
                  Total Allowances: <span className="ml-1 text-green-600">{totalAllowanceAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">Deductions</h4>
              </div>
              <div className="space-y-2">
                {deductionTypes.map(type => {
                  const d = deductions.find(x => x.type === type)
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="w-28 text-sm capitalize text-muted-foreground">{type}</span>
                      <input type="number" placeholder="Amount" value={d?.amount || ''} onChange={e => {
                        const updated = [...deductions.filter(x => x.type !== type)]
                        if (e.target.value) updated.push({ type, amount: e.target.value })
                        setDeductions(updated)
                      }} className="flex-1 px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  )
                })}
                <div className="flex justify-end text-sm font-medium text-foreground pt-1 border-t border-border">
                  Total Deductions: <span className="ml-1 text-red-600">-{totalDeductionAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Salary Summary */}
            <div className="bg-muted/30 rounded-lg p-4 mb-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Basic Salary</span><span className="font-semibold">{basicSalary.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Allowances</span><span className="font-semibold text-green-600">+{totalAllowanceAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Deductions</span><span className="font-semibold text-red-600">-{totalDeductionAmount.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold text-foreground">
                <span>Net Pay</span><span>{netPay.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setAllowances([]); setDeductions([]) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Update' : 'Add Employee'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading employees...</p></div>
      ) : (
        <DataTable columns={columns} data={employees} title="Employees"
          actions={(row) => (
            <div className="flex items-center gap-1">
              <motion.button onClick={() => openEdit(row as Employee)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
              <motion.button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
            </div>
          )}
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/30',
  }
  return (
    <motion.div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
    </motion.div>
  )
}