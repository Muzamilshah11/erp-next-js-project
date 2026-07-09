'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Search, X, Loader2, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface Asset { id: string; assetNo: string; name: string; category: { id: string; name: string }; class: { id: string; name: string }; purchaseDate: string; purchaseCost: number; currentValue: number; netBookValue: number; status: string; location: string | null; serialNo: string | null }
interface Category { id: string; name: string }
interface AssetClass { id: string; name: string }

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [classes, setClasses] = useState<AssetClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', categoryId: '', classId: '', purchaseDate: '', purchaseCost: '', currentValue: '', location: '', serialNo: '' })
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchAssets = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (filterCategory) params.set('categoryId', filterCategory)
      if (filterClass) params.set('classId', filterClass)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/fixed-assets/assets?${params}`); const d = await res.json()
      if (!res.ok) throw new Error(d.error); setAssets(d.assets)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAssets(); fetch('/api/fixed-assets/categories').then(r => r.json()).then(d => setCategories(d.categories)).catch(() => {}); fetch('/api/fixed-assets/classes').then(r => r.json()).then(d => setClasses(d.classes)).catch(() => {}) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.categoryId || !form.classId || !form.purchaseDate || !form.purchaseCost) { setError('All required fields'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/fixed-assets/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, purchaseCost: parseFloat(form.purchaseCost), currentValue: form.currentValue ? parseFloat(form.currentValue) : undefined }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowForm(false); setForm({ name: '', categoryId: '', classId: '', purchaseDate: '', purchaseCost: '', currentValue: '', location: '', serialNo: '' }); fetchAssets()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', disposed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', sold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Fixed Assets</h1><p className="text-muted-foreground mt-1">Manage company fixed assets</p></div>
        <motion.button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" />New Asset</motion.button>
      </motion.div>

      <div className="flex gap-4 flex-wrap items-end">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"><option value="">All Categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"><option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"><option value="">All Status</option><option value="active">Active</option><option value="disposed">Disposed</option><option value="sold">Sold</option></select>
        <button onClick={fetchAssets} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Filter</button>
      </div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add New Asset</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Asset Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Category *</label><select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Class *</label><select value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Purchase Date *</label><input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Purchase Cost *</label><input type="number" min={0} step={0.01} value={form.purchaseCost} onChange={e => setForm({ ...form, purchaseCost: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Current Value</label><input type="number" min={0} step={0.01} value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
              <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <input type="text" placeholder="Serial No" value={form.serialNo} onChange={e => setForm({ ...form, serialNo: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Create Asset</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading assets...</p></div>
      ) : (
        <DataTable columns={[
          { key: 'assetNo', label: 'Asset No', sortable: true },
          { key: 'name', label: 'Name', sortable: true },
          { key: 'category.name', label: 'Category' },
          { key: 'class.name', label: 'Class' },
          { key: 'purchaseDate', label: 'Purchase Date', render: (_: unknown, row: Asset) => new Date(row.purchaseDate).toLocaleDateString() },
          { key: 'purchaseCost', label: 'Cost', render: (_: unknown, row: Asset) => formatCurrency(row.purchaseCost) },
          { key: 'currentValue', label: 'Current Value', render: (_: unknown, row: Asset) => formatCurrency(row.currentValue) },
          { key: 'status', label: 'Status', render: (_: unknown, row: Asset) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || ''}`}>{row.status}</span> },
        ]} data={assets} title="All Assets" actions={(row: Asset) => (
          <Link href={`/fixed-assets/assets/${row.id}`} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex"><Eye className="w-4 h-4" /></Link>
        )} />
      )}
    </div>
  )
}