'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Asset { id: string; assetNo: string; name: string; category: { name: string }; class: { name: string; usefulLife: number; salvageValue: number }; purchaseDate: string; purchaseCost: number; currentValue: number; accumulatedDepr: number; netBookValue: number; location: string | null; serialNo: string | null; status: string }
interface Transaction { id: string; type: string; date: string; description: string | null; amount: number; status: string }
interface DeprEntry { id: string; assetId: string; period: string; amount: number; status: string; createdAt: string }

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [depreciation, setDepreciation] = useState<DeprEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTxForm, setShowTxForm] = useState(false)
  const [showDeprForm, setShowDeprForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [txForm, setTxForm] = useState({ type: 'transfer', date: new Date().toISOString().slice(0, 10), description: '', amount: '0', fromLocation: '', toLocation: '' })
  const [deprForm, setDeprForm] = useState({ period: new Date().toISOString().slice(0, 7), amount: '' })
  const [editForm, setEditForm] = useState({ name: '', location: '', serialNo: '', currentValue: '', status: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const [assetRes, txRes, deprRes] = await Promise.all([
        fetch(`/api/fixed-assets/assets/${id}`),
        fetch(`/api/fixed-assets/transactions?assetId=${id}`),
        fetch('/api/fixed-assets/depreciation'),
      ])
      const [assetD, txD, deprD] = await Promise.all([assetRes.json(), txRes.json(), deprRes.json()])
      if (!assetRes.ok) throw new Error(assetD.error)
      setAsset(assetD.asset); setTransactions(txD.transactions)
      setDepreciation(deprD.depreciationEntries.filter((e: DeprEntry) => e.assetId === id))
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) fetchData() }, [id])

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const res = await fetch('/api/fixed-assets/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetId: id, ...txForm, amount: parseFloat(txForm.amount) }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowTxForm(false); setTxForm({ type: 'transfer', date: new Date().toISOString().slice(0, 10), description: '', amount: '0', fromLocation: '', toLocation: '' }); fetchData()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to create transaction') }
    finally { setSaving(false) }
  }

  const handleDeprSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!deprForm.period || !deprForm.amount) { setError('Period and amount required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/fixed-assets/depreciation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetId: id, ...deprForm, amount: parseFloat(deprForm.amount) }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowDeprForm(false); fetchData()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to post depreciation') }
    finally { setSaving(false) }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const res = await fetch(`/api/fixed-assets/assets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowEditForm(false); fetchData()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to update') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading asset...</p></div>
  if (!asset) return <div className="bg-card rounded-xl border border-border p-12 text-center"><p className="text-muted-foreground">Asset not found</p></div>

  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', disposed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', sold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' }
  const monthlyDepr = ((asset.purchaseCost - asset.class.salvageValue) / (asset.class.usefulLife * 12)).toFixed(2)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link href="/fixed-assets/assets"><motion.button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }}><ArrowLeft className="w-5 h-5" /></motion.button></Link>
        <h1 className="text-2xl font-bold text-foreground">{asset.assetNo} - {asset.name}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[asset.status] || ''}`}>{asset.status}</span>
        <motion.button onClick={() => { setEditForm({ name: asset.name, location: asset.location || '', serialNo: asset.serialNo || '', currentValue: String(asset.currentValue), status: asset.status }); setShowEditForm(true) }} className="ml-auto p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }}><Pencil className="w-4 h-4" /></motion.button>
      </motion.div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Purchase Cost', value: `$${asset.purchaseCost.toLocaleString()}`, color: '' },
          { label: 'Current Value', value: `$${asset.currentValue.toLocaleString()}`, color: '' },
          { label: 'Accumulated Depreciation', value: `$${asset.accumulatedDepr.toLocaleString()}`, color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Net Book Value', value: `$${asset.netBookValue.toLocaleString()}`, color: 'text-green-600 dark:text-green-400' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-4 grid grid-cols-4 gap-4 text-sm">
        <div><span className="text-muted-foreground">Category:</span> <span className="text-foreground">{asset.category.name}</span></div>
        <div><span className="text-muted-foreground">Class:</span> <span className="text-foreground">{asset.class.name}</span></div>
        <div><span className="text-muted-foreground">Useful Life:</span> <span className="text-foreground">{asset.class.usefulLife} yrs</span></div>
        <div><span className="text-muted-foreground">Salvage Value:</span> <span className="text-foreground">${asset.class.salvageValue}</span></div>
        <div><span className="text-muted-foreground">Purchase Date:</span> <span className="text-foreground">{new Date(asset.purchaseDate).toLocaleDateString()}</span></div>
        <div><span className="text-muted-foreground">Location:</span> <span className="text-foreground">{asset.location || '-'}</span></div>
        <div><span className="text-muted-foreground">Serial No:</span> <span className="text-foreground">{asset.serialNo || '-'}</span></div>
        <div><span className="text-muted-foreground">Monthly Depreciation:</span> <span className="text-foreground">${monthlyDepr}</span></div>
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <div className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-foreground">Transactions</h2><motion.button onClick={() => setShowTxForm(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" />New Transaction</motion.button></div>

        <AnimatePresence>
          {showTxForm && (
            <motion.form onSubmit={handleTxSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
              <h3 className="text-lg font-semibold text-foreground mb-4">New Transaction</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-muted-foreground mb-1">Type *</label><select value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"><option value="transfer">Transfer</option><option value="disposal">Disposal</option><option value="sale">Sale</option><option value="adjustment">Adjustment</option><option value="maintenance">Maintenance</option></select></div>
                <div><label className="block text-sm text-muted-foreground mb-1">Date *</label><input type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
                <input type="text" placeholder="Description" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                <div><label className="block text-sm text-muted-foreground mb-1">Amount</label><input type="number" min={0} step={0.01} value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
                <input type="text" placeholder="From Location" value={txForm.fromLocation} onChange={e => setTxForm({ ...txForm, fromLocation: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                <input type="text" placeholder="To Location" value={txForm.toLocation} onChange={e => setTxForm({ ...txForm, toLocation: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setShowTxForm(false)} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Create</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <DataTable columns={[
          { key: 'date', label: 'Date', sortable: true, render: (_: unknown, row: Transaction) => new Date(row.date).toLocaleDateString() },
          { key: 'type', label: 'Type' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount', render: (_: unknown, row: Transaction) => `$${row.amount.toLocaleString()}` },
          { key: 'status', label: 'Status' },
        ]} data={transactions} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-foreground">Depreciation Entries</h2><motion.button onClick={() => { setDeprForm({ period: new Date().toISOString().slice(0, 7), amount: monthlyDepr }); setShowDeprForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" />Post Depreciation</motion.button></div>

        <AnimatePresence>
          {showDeprForm && (
            <motion.form onSubmit={handleDeprSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
              <h3 className="text-lg font-semibold text-foreground mb-4">Post Depreciation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-muted-foreground mb-1">Period (YYYY-MM) *</label><input type="month" value={deprForm.period} onChange={e => setDeprForm({ ...deprForm, period: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
                <div><label className="block text-sm text-muted-foreground mb-1">Amount *</label><input type="number" min={0} step={0.01} value={deprForm.amount} onChange={e => setDeprForm({ ...deprForm, amount: e.target.value })} required className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setShowDeprForm(false)} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Post</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <DataTable columns={[
          { key: 'period', label: 'Period', sortable: true },
          { key: 'amount', label: 'Amount', render: (_: unknown, row: DeprEntry) => `$${row.amount.toLocaleString()}` },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Posted Date', render: (_: unknown, row: DeprEntry) => new Date(row.createdAt).toLocaleDateString() },
        ]} data={depreciation} />
      </div>

      {/* Edit form */}
      <AnimatePresence>
        {showEditForm && (
          <motion.form onSubmit={handleEditSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Edit Asset</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <input type="text" placeholder="Location" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <input type="text" placeholder="Serial No" value={editForm.serialNo} onChange={e => setEditForm({ ...editForm, serialNo: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Current Value</label><input type="number" step={0.01} value={editForm.currentValue} onChange={e => setEditForm({ ...editForm, currentValue: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">Status</label><select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"><option value="active">Active</option><option value="disposed">Disposed</option><option value="sold">Sold</option></select></div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Save</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}