'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TaxRate { id: string; name: string; rate: number; isDefault: boolean; applicableTo: string; status: string }

const columns = [
  { key: 'name' as const, label: 'Name', sortable: true },
  { key: 'rate' as const, label: 'Rate %', sortable: true, render: (v: number) => `${v}%` },
  { key: 'applicableTo' as const, label: 'Applies To', render: (v: string) => <span className="capitalize">{v}</span> },
  { key: 'isDefault' as const, label: 'Default', render: (v: boolean) => v ? <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded text-xs font-medium">Default</span> : '-' },
  { key: 'status' as const, label: 'Status', render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${v === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{v}</span> },
]

export default function TaxRatesPage() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<TaxRate | null>(null)
  const [form, setForm] = useState({ name: '', rate: '', isDefault: 'false', applicableTo: 'both', status: 'active' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/setup/tax-rates'); const d = await res.json(); setTaxRates(d.taxRates || []) }
    catch { setError('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const url = editing ? `/api/setup/tax-rates/${editing.id}` : '/api/setup/tax-rates'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, rate: parseFloat(form.rate) }) })
      if (!res.ok) throw new Error('Failed')
      setForm({ name: '', rate: '', isDefault: 'false', applicableTo: 'both', status: 'active' }); setEditing(null); setShowForm(false); fetchData()
    } catch { setError('Failed to save') } finally { setSaving(false) }
  }

  const handleEdit = (item: TaxRate) => {
    setForm({ name: item.name, rate: String(item.rate), isDefault: String(item.isDefault), applicableTo: item.applicableTo, status: item.status })
    setEditing(item); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tax rate?')) return
    try { await fetch(`/api/setup/tax-rates/${id}`, { method: 'DELETE' }); fetchData() }
    catch { setError('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Tax Rates</h1><p className="text-muted-foreground mt-1">Define tax rates for sales, purchases, and items</p></div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', rate: '', isDefault: 'false', applicableTo: 'both', status: 'active' }) }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg"><Plus className="w-4 h-4" /> Add Tax Rate</button>
      </motion.div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

      {showForm && <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border rounded-xl p-4 overflow-hidden">
        <h3 className="text-sm font-semibold mb-3">{editing ? 'Edit' : 'Add'} Tax Rate</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. GST 18%" required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <input type="number" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} placeholder="Rate %" required className="px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <select value={form.applicableTo} onChange={e => setForm({ ...form, applicableTo: e.target.value })} className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="both">Both Sales & Purchase</option><option value="sales">Sales Only</option><option value="purchase">Purchase Only</option></select>
          <select value={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.value })} className="px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="false">Not Default</option><option value="true">Set as Default</option></select>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-3 py-1.5 border border-border rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">{saving && <Loader2 className="w-3 h-3 animate-spin" />}{editing ? 'Update' : 'Add'}</button>
        </div>
      </motion.form>}

      {loading ? <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      : <DataTable columns={columns} data={taxRates} title="Tax Rates" actions={(row) => <div className="flex items-center gap-1">
        <button onClick={() => handleEdit(row as TaxRate)} className="p-2 text-muted-foreground hover:text-primary rounded-lg"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(row.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg"><Trash2 className="w-4 h-4" /></button>
      </div>} />}
    </div>
  )
}
