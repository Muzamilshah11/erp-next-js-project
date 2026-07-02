'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Eye, Trash2, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface JournalEntry {
  id: string
  entryNo: string
  date: string
  description: string
  debit: number
  credit: number
  status: 'posted' | 'draft'
}

const columns = [
  {
    key: 'entryNo' as const,
    label: 'Entry No.',
    sortable: true,
  },
  {
    key: 'date' as const,
    label: 'Date',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString('en-PK'),
  },
  {
    key: 'description' as const,
    label: 'Description',
    sortable: true,
  },
  {
    key: 'debit' as const,
    label: 'Debit',
    sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
      }).format(value),
  },
  {
    key: 'credit' as const,
    label: 'Credit',
    sortable: true,
    render: (value: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
      }).format(value),
  },
  {
    key: 'status' as const,
    label: 'Status',
    render: (value: string) => (
      <motion.span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === 'posted'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
        }`}
        whileHover={{ scale: 1.05 }}
      >
        {value}
      </motion.span>
    ),
  },
]

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null)
  const [form, setForm] = useState({ date: '', description: '', debit: '', credit: '' })

  const fetchEntries = async () => {
    const res = await fetch('/api/finance/journal-entries')
    const data = await res.json()
    setEntries(data.entries.map((entry: { date: string; lines: { debit: number; credit: number }[]; id: string; entryNo: string; description: string; status: string }) => ({
      id: entry.id,
      entryNo: entry.entryNo,
      date: entry.date,
      description: entry.description,
      debit: entry.lines?.reduce((s: number, l: { debit: number }) => s + l.debit, 0) || 0,
      credit: entry.lines?.reduce((s: number, l: { credit: number }) => s + l.credit, 0) || 0,
      status: entry.status,
    })))
  }

  useEffect(() => { fetchEntries() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/finance/journal-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date,
        description: form.description,
        totalDebit: parseFloat(form.debit) || 0,
        totalCredit: parseFloat(form.credit) || 0,
        status: 'draft',
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ date: '', description: '', debit: '', credit: '' })
      fetchEntries()
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Journal Entries</h1>
          <p className="text-muted-foreground mt-1">Record and manage journal entries</p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          New Entry
        </motion.button>
      </motion.div>

      {showForm && (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Create Journal Entry</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Reference (e.g. INV001)"
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Total Debit"
                value={form.debit}
                onChange={e => setForm({ ...form, debit: e.target.value })}
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Total Credit"
                value={form.credit}
                onChange={e => setForm({ ...form, credit: e.target.value })}
                className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow">
                Post Entry
              </button>
            </div>
          </div>
        </motion.form>
      )}

      <DataTable
        columns={columns}
        data={entries}
        title="Journal Entries"
        actions={(row) => (
          <>
            <motion.button
              onClick={() => setViewEntry(row)}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </motion.button>
            {row.status === 'draft' && (
              <motion.button
                onClick={async () => {
                  if (window.confirm('Delete this journal entry?')) {
                    await fetch(`/api/finance/journal-entries/${row.id}`, { method: 'DELETE' })
                    fetchEntries()
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
          </>
        )}
      />

      {/* View Details Modal */}
      {viewEntry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewEntry(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-card rounded-xl p-6 max-w-lg w-full shadow-xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{viewEntry.entryNo}</h3>
              <button onClick={() => setViewEntry(null)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Description:</span> {viewEntry.description}</p>
              <p><span className="text-muted-foreground">Debit:</span> {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(viewEntry.debit)}</p>
              <p><span className="text-muted-foreground">Credit:</span> {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(viewEntry.credit)}</p>
              <p><span className="text-muted-foreground">Status:</span> {viewEntry.status}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
