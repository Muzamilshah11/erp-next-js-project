'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, AlertTriangle, TrendingUp } from 'lucide-react'
import { useState } from 'react'

interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  quantity: number
  reorderLevel: number
  unitPrice: number
  value: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

const mockItems: InventoryItem[] = [
  {
    id: '1',
    sku: 'SKU-001',
    name: 'Laptop Pro',
    category: 'Electronics',
    quantity: 15,
    reorderLevel: 5,
    unitPrice: 125000,
    value: 1875000,
    status: 'in-stock',
  },
  {
    id: '2',
    sku: 'SKU-002',
    name: 'USB Cable',
    category: 'Accessories',
    quantity: 3,
    reorderLevel: 20,
    unitPrice: 500,
    value: 1500,
    status: 'low-stock',
  },
  {
    id: '3',
    sku: 'SKU-003',
    name: 'Office Chair',
    category: 'Furniture',
    quantity: 0,
    reorderLevel: 3,
    unitPrice: 15000,
    value: 0,
    status: 'out-of-stock',
  },
  {
    id: '4',
    sku: 'SKU-004',
    name: 'Desk Lamp',
    category: 'Lighting',
    quantity: 42,
    reorderLevel: 10,
    unitPrice: 3500,
    value: 147000,
    status: 'in-stock',
  },
  {
    id: '5',
    sku: 'SKU-005',
    name: 'Monitor 24"',
    category: 'Electronics',
    quantity: 8,
    reorderLevel: 5,
    unitPrice: 35000,
    value: 280000,
    status: 'in-stock',
  },
]

const columns = [
  {
    key: 'sku' as const,
    label: 'SKU',
    sortable: true,
    render: (value: string) => (
      <motion.span className="font-mono text-sm font-semibold text-primary" whileHover={{ scale: 1.05 }}>
        {value}
      </motion.span>
    ),
  },
  {
    key: 'name' as const,
    label: 'Product Name',
    sortable: true,
  },
  {
    key: 'category' as const,
    label: 'Category',
    sortable: true,
  },
  {
    key: 'quantity' as const,
    label: 'Qty In Stock',
    sortable: true,
    render: (value: number, row: InventoryItem) => (
      <motion.div
        className={`flex items-center gap-2 font-semibold ${
          value === 0
            ? 'text-red-600'
            : value < row.reorderLevel
              ? 'text-amber-600'
              : 'text-green-600'
        }`}
        whileHover={{ scale: 1.05 }}
      >
        {value === 0 && <AlertTriangle className="w-4 h-4" />}
        {value < row.reorderLevel && value > 0 && <TrendingUp className="w-4 h-4" />}
        {value}
      </motion.div>
    ),
  },
  {
    key: 'reorderLevel' as const,
    label: 'Reorder Level',
    sortable: true,
  },
  {
    key: 'unitPrice' as const,
    label: 'Unit Price',
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(value),
  },
  {
    key: 'value' as const,
    label: 'Total Value',
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
    render: (value: string) => {
      const statusConfig = {
        'in-stock': 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        'low-stock': 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        'out-of-stock': 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      }
      return (
        <motion.span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[value as keyof typeof statusConfig]}`}
          whileHover={{ scale: 1.05 }}
        >
          {value.replace('-', ' ')}
        </motion.span>
      )
    },
  },
]

export default function InventoryItemsPage() {
  const [showForm, setShowForm] = useState(false)

  const totalValue = mockItems.reduce((sum, item) => sum + item.value, 0)
  const lowStockItems = mockItems.filter(item => item.quantity < item.reorderLevel)
  const outOfStock = mockItems.filter(item => item.quantity === 0)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Items</h1>
          <p className="text-muted-foreground mt-1">Track stock levels and manage inventory</p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Add Item
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
          <p className="text-sm text-muted-foreground">Total Inventory Value</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {new Intl.NumberFormat('en-PK', {
              style: 'currency',
              currency: 'PKR',
              minimumFractionDigits: 0,
            }).format(totalValue)}
          </p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <p className="text-sm text-muted-foreground">Low Stock Items</p>
          <p className="text-2xl font-bold text-foreground mt-2">{lowStockItems.length}</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="text-2xl font-bold text-foreground mt-2">{outOfStock.length}</p>
        </motion.div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Add New Item</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Item Name"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="SKU"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Select Category</option>
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Accessories</option>
            </select>
            <input
              type="number"
              placeholder="Unit Price"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Initial Quantity"
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Reorder Level"
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
              Add Item
            </button>
          </div>
        </motion.div>
      )}

      <DataTable columns={columns} data={mockItems} title="Inventory Items" />
    </div>
  )
}
