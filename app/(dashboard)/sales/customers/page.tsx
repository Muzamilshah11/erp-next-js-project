'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Phone, Mail, MapPin } from 'lucide-react'
import { useState } from 'react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  totalSales: number
  balance: number
  status: 'active' | 'inactive'
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'ABC Trading Co.',
    email: 'contact@abctrading.pk',
    phone: '+92-21-123456',
    city: 'Karachi',
    totalSales: 450000,
    balance: 85000,
    status: 'active',
  },
  {
    id: '2',
    name: 'XYZ Enterprises',
    email: 'info@xyzent.pk',
    phone: '+92-42-654321',
    city: 'Lahore',
    totalSales: 320000,
    balance: -25000,
    status: 'active',
  },
  {
    id: '3',
    name: 'Tech Solutions Ltd.',
    email: 'sales@techsol.pk',
    phone: '+92-51-987654',
    city: 'Islamabad',
    totalSales: 210000,
    balance: 0,
    status: 'active',
  },
  {
    id: '4',
    name: 'Global Imports',
    email: 'contact@globalimports.pk',
    phone: '+92-300-1234567',
    city: 'Faisalabad',
    totalSales: 550000,
    balance: 150000,
    status: 'active',
  },
  {
    id: '5',
    name: 'Retail Plus',
    email: 'support@retailplus.pk',
    phone: '+92-21-5554321',
    city: 'Karachi',
    totalSales: 180000,
    balance: -45000,
    status: 'inactive',
  },
]

const columns = [
  {
    key: 'name' as const,
    label: 'Customer Name',
    sortable: true,
  },
  {
    key: 'email' as const,
    label: 'Email',
    render: (value: string) => (
      <motion.div
        className="flex items-center gap-2 cursor-pointer hover:text-primary"
        whileHover={{ x: 4 }}
      >
        <Mail className="w-4 h-4 text-muted-foreground" />
        <span>{value}</span>
      </motion.div>
    ),
  },
  {
    key: 'phone' as const,
    label: 'Phone',
    render: (value: string) => (
      <motion.div
        className="flex items-center gap-2 cursor-pointer hover:text-primary"
        whileHover={{ x: 4 }}
      >
        <Phone className="w-4 h-4 text-muted-foreground" />
        <span>{value}</span>
      </motion.div>
    ),
  },
  {
    key: 'city' as const,
    label: 'City',
    sortable: true,
    render: (value: string) => (
      <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span>{value}</span>
      </motion.div>
    ),
  },
  {
    key: 'totalSales' as const,
    label: 'Total Sales',
    sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(value),
  },
  {
    key: 'balance' as const,
    label: 'Balance',
    sortable: true,
    render: (value: number) => (
      <motion.span
        className={`font-semibold ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-foreground'}`}
        whileHover={{ scale: 1.05 }}
      >
        {new Intl.NumberFormat('en-PK', {
          style: 'currency',
          currency: 'PKR',
          minimumFractionDigits: 0,
        }).format(value)}
      </motion.span>
    ),
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

export default function CustomersPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer relationships</p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          New Customer
        </motion.button>
      </motion.div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Add New Customer</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company Name"
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
            <input
              type="text"
              placeholder="City"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Business Registration"
              className="col-span-2 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              Save Customer
            </button>
          </div>
        </motion.div>
      )}

      <DataTable columns={columns} data={mockCustomers} title="All Customers" />
    </div>
  )
}
