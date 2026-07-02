'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, User, Mail, Phone, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  designation: string
  department: string
  joinDate: string
  salary: number
  status: 'active' | 'inactive'
}

const columns = [
  {
    key: 'name' as const,
    label: 'Employee Name',
    sortable: true,
    render: (value: string) => (
      <motion.div className="flex items-center gap-2" whileHover={{ x: 4 }}>
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
          {value.charAt(0)}
        </div>
        <span>{value}</span>
      </motion.div>
    ),
  },
  {
    key: 'email' as const,
    label: 'Email',
    render: (value: string) => (
      <motion.div className="flex items-center gap-2" whileHover={{ x: 4 }}>
        <Mail className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{value}</span>
      </motion.div>
    ),
  },
  {
    key: 'phone' as const,
    label: 'Phone',
    render: (value: string) => (
      <motion.div className="flex items-center gap-2" whileHover={{ x: 4 }}>
        <Phone className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{value}</span>
      </motion.div>
    ),
  },
  {
    key: 'designation' as const,
    label: 'Designation',
    sortable: true,
  },
  {
    key: 'department' as const,
    label: 'Department',
    sortable: true,
    render: (value: string) => (
      <motion.span
        className="px-2 py-1 bg-secondary/50 rounded text-sm font-medium"
        whileHover={{ scale: 1.05 }}
      >
        {value}
      </motion.span>
    ),
  },
  {
    key: 'joinDate' as const,
    label: 'Join Date',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
  },
  {
    key: 'salary' as const,
    label: 'Salary',
    sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(value),
  },
  {
    key: 'status' as const,
    label: 'Status',
    render: (value: string) => (
      <motion.span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === 'active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
        }`}
        whileHover={{ scale: 1.05 }}
      >
        {value}
      </motion.span>
    ),
  },
]

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', designation: '', salary: '' })

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/hr/employees')
      const data = await res.json()
      setEmployees(data.employees)
    } catch (err) {
      console.error('Failed to fetch employees', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/hr/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, salary: parseFloat(form.salary) || 0, status: 'active', joinDate: new Date().toISOString().split('T')[0] }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ name: '', email: '', phone: '', department: '', designation: '', salary: '' })
      fetchEmployees()
    }
  }

  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'active').length
  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Human Resources</h1>
          <p className="text-muted-foreground mt-1">Manage employees and payroll</p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl font-bold text-foreground mt-2">{totalEmployees}</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <p className="text-sm text-muted-foreground">Active Employees</p>
          <p className="text-2xl font-bold text-foreground mt-2">{activeEmployees}</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <p className="text-sm text-muted-foreground">Monthly Payroll</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {new Intl.NumberFormat('en-PK', {
              style: 'currency',
              currency: 'PKR',
              minimumFractionDigits: 0,
            }).format(totalPayroll)}
          </p>
        </motion.div>
      </div>

      {showForm && (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Add New Employee</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Department</option>
              <option>Finance</option>
              <option>Sales</option>
              <option>Inventory</option>
              <option>HR</option>
            </select>
            <input
              type="text"
              placeholder="Designation"
              value={form.designation}
              onChange={e => setForm({ ...form, designation: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Salary"
              value={form.salary}
              onChange={e => setForm({ ...form, salary: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow">
              Add Employee
            </button>
          </div>
        </motion.form>
      )}

      <DataTable
        columns={columns}
        data={employees}
        title="Employees"
        actions={(row) => (
          <motion.button
            onClick={async () => {
              if (window.confirm('Delete this employee?')) {
                await fetch(`/api/hr/employees/${row.id}`, { method: 'DELETE' })
                fetchEmployees()
              }
            }}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        )}
      />
    </div>
  )
}
