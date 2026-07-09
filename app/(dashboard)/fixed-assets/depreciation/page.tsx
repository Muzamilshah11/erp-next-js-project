'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Play, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'

interface DeprEntry { id: string; period: string; amount: number; status: string; createdAt: string; asset: { id: string; name: string; assetNo: string } }

export default function DepreciationPage() {
  const [entries, setEntries] = useState<DeprEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showProcessForm, setShowProcessForm] = useState(false)
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [processing, setProcessing] = useState(false)

  const fetchEntries = async () => {
    setLoading(true); setError('')
    try { const res = await fetch('/api/fixed-assets/depreciation'); const d = await res.json(); if (!res.ok) throw new Error(d.error); setEntries(d.depreciationEntries) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEntries() }, [])

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault(); setProcessing(true); setError('')
    try {
      const res = await fetch('/api/fixed-assets/depreciation/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowProcessForm(false); fetchEntries()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to process') }
    finally { setProcessing(false) }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Depreciation</h1><p className="text-muted-foreground mt-1">Manage asset depreciation entries</p></div>
        <motion.button onClick={() => setShowProcessForm(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Play className="w-4 h-4" />Process Depreciation</motion.button>
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showProcessForm && (
          <motion.form onSubmit={handleProcess} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Process Monthly Depreciation</h3>
            <div className="max-w-sm">
              <label className="block text-sm text-muted-foreground mb-1">Period (YYYY-MM) *</label>
              <input type="month" value={period} onChange={e => setPeriod(e.target.value)} required className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <p className="text-sm text-muted-foreground mt-2">Calculates and posts depreciation for all active assets for the selected period. Already-processed assets are skipped.</p>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowProcessForm(false)} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={processing} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{processing && <Loader2 className="w-4 h-4 animate-spin" />}Process</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading depreciation entries...</p></div>
      ) : (
        <DataTable columns={[
          { key: 'period', label: 'Period', sortable: true },
          { key: 'asset.assetNo', label: 'Asset No' },
          { key: 'asset.name', label: 'Asset Name' },
          { key: 'amount', label: 'Amount', render: (_: unknown, row: DeprEntry) => formatCurrency(row.amount) },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Posted Date', render: (_: unknown, row: DeprEntry) => new Date(row.createdAt).toLocaleDateString() },
        ]} data={entries} title="Depreciation Entries" />
      )}
    </div>
  )
}