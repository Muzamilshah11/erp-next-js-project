'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, AlertTriangle, TrendingUp, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'

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
  const [items, setItems] = useState<InventoryItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', category: '', unitPrice: '', quantity: '', reorderLevel: '' })

  const fetchItems = async () => {
    const res = await fetch('/api/inventory/items')
    const data = await res.json()
    setItems(data.items.map((item: { unitPrice: number; quantity: number; reorderLevel: number; id: string; sku: string; name: string; category: string; status: string }) => ({
      ...item,
      unitPrice: item.unitPrice,
      value: item.unitPrice * item.quantity,
      reorderLevel: item.reorderLevel,
    })))
  }

  useEffect(() => { fetchItems() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/inventory/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        unitPrice: parseFloat(form.unitPrice) || 0,
        quantity: parseInt(form.quantity) || 0,
        reorderLevel: parseInt(form.reorderLevel) || 0,
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ name: '', sku: '', category: '', unitPrice: '', quantity: '', reorderLevel: '' })
      fetchItems()
    }
  }

  const totalValue = items.reduce((sum, item) => sum + item.value, 0)
  const lowStockItems = items.filter(item => item.quantity < item.reorderLevel && item.quantity > 0)
  const outOfStock = items.filter(item => item.quantity === 0)

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
        <motion.form
          onSubmit={handleSubmit}
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
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="SKU"
              value={form.sku}
              onChange={e => setForm({ ...form, sku: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Category</option>
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Accessories</option>
            </select>
            <input
              type="number"
              placeholder="Unit Price"
              value={form.unitPrice}
              onChange={e => setForm({ ...form, unitPrice: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Initial Quantity"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              required
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Reorder Level"
              value={form.reorderLevel}
              onChange={e => setForm({ ...form, reorderLevel: e.target.value })}
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
              Add Item
            </button>
          </div>
        </motion.form>
      )}

      <DataTable
        columns={columns}
        data={items}
        title="Inventory Items"
        actions={(row) => (
          <motion.button
            onClick={async () => {
              if (window.confirm('Delete this item?')) {
                await fetch(`/api/inventory/items/${row.id}`, { method: 'DELETE' })
                fetchItems()
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
