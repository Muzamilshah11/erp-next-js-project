'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Loader2, Calendar, Trash2, Pencil, CheckCircle, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface FiscalYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export default function FiscalYearsPage() {
  const [items, setItems] = useState<FiscalYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FiscalYear | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isActive: false })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/setup/fiscal-years')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems(data.fiscalYears || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const openNew = () => {
    const year = new Date().getFullYear()
    setEditing(null)
    setForm({
      name: `FY ${year}-${year + 1}`,
      startDate: `${year}-07-01`,
      endDate: `${year + 1}-06-30`,
      isActive: false,
    })
    setShowForm(true)
  }

  const openEdit = (item: FiscalYear) => {
    setEditing(item)
    setForm({
      name: item.name,
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate.slice(0, 10),
      isActive: item.isActive,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing ? `/api/setup/fiscal-years/${editing.id}` : '/api/setup/fiscal-years'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false)
      setEditing(null)
      fetchItems()
    } catch {
      setError('Failed to save fiscal year')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this fiscal year?')) return
    try {
      const res = await fetch(`/api/setup/fiscal-years/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      fetchItems()
    } catch {
      setError('Failed to delete')
    }
  }

  const columns = [
    {
      key: 'name' as const,
      label: 'Fiscal Year',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold">{value}</span>
        </div>
      ),
    },
    {
      key: 'startDate' as const,
      label: 'Start Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
    },
    {
      key: 'endDate' as const,
      label: 'End Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
    },
    {
      key: 'isActive' as const,
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${value ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'}`}>
          {value ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fiscal Years</h1>
          <p className="text-muted-foreground mt-1">Manage financial year periods</p>
        </div>
        <motion.button
          onClick={openNew}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" /> New Fiscal Year
        </motion.button>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Fiscal Year' : 'New Fiscal Year'}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Year Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. FY 2024-2025"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Set as Active</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading fiscal years...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          title="Fiscal Years"
          actions={(row) => (
            <div className="flex items-center gap-1">
              <motion.button
                onClick={() => openEdit(row)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                whileHover={{ scale: 1.1 }}
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => handleDelete(row.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                whileHover={{ scale: 1.1 }}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        />
      )}
    </div>
  )
}
