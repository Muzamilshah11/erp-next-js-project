'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, User, Mail, Phone } from 'lucide-react'
import { useState } from 'react'

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

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@company.pk',
    phone: '+92-300-1234567',
    designation: 'Finance Manager',
    department: 'Finance',
    joinDate: '2023-01-15',
    salary: 150000,
    status: 'active',
  },
  {
    id: '2',
    name: 'Fatima Khan',
    email: 'fatima.khan@company.pk',
    phone: '+92-321-9876543',
    designation: 'Sales Executive',
    department: 'Sales',
    joinDate: '2023-06-20',
    salary: 85000,
    status: 'active',
  },
  {
    id: '3',
    name: 'Muhammad Ali',
    email: 'ali.muhammad@company.pk',
    phone: '+92-333-5555555',
    designation: 'Inventory Supervisor',
    department: 'Inventory',
    joinDate: '2022-11-10',
    salary: 120000,
    status: 'active',
  },
  {
    id: '4',
    name: 'Sara Ahmed',
    email: 'sara.ahmed@company.pk',
    phone: '+92-345-7654321',
    designation: 'HR Specialist',
    department: 'HR',
    joinDate: '2024-01-05',
    salary: 95000,
    status: 'active',
  },
  {
    id: '5',
    name: 'Khalid Hussain',
    email: 'khalid.h@company.pk',
    phone: '+92-300-4444444',
    designation: 'Accounts Officer',
    department: 'Finance',
    joinDate: '2023-03-22',
    salary: 75000,
    status: 'inactive',
  },
]

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
  const [showForm, setShowForm] = useState(false)

  const totalEmployees = mockEmployees.length
  const activeEmployees = mockEmployees.filter(e => e.status === 'active').length
  const totalPayroll = mockEmployees.reduce((sum, e) => sum + e.salary, 0)

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
        <motion.div
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
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="email"
              placeholder="Email"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="tel"
              placeholder="Phone"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Select Department</option>
              <option>Finance</option>
              <option>Sales</option>
              <option>Inventory</option>
              <option>HR</option>
            </select>
            <input
              type="text"
              placeholder="Designation"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Salary"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow">
              Add Employee
            </button>
          </div>
        </motion.div>
      )}

      <DataTable columns={columns} data={mockEmployees} title="Employees" />
    </div>
  )
}
