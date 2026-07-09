'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Summary { activeCount: number; disposedCount: number; totalPurchaseCost: number; totalDepreciation: number }
interface DeprSchedule { id: string; assetNo: string; name: string; category: string; purchaseCost: number; accumulatedDepr: number; netBookValue: number; usefulLife: number; salvageValue: number; lastDepreciation: string }

export default function InquiriesPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [schedule, setSchedule] = useState<DeprSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'summary' | 'schedule'>('summary')

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const [sumRes, schedRes] = await Promise.all([
        fetch('/api/fixed-assets/inquiries?type=summary'),
        fetch('/api/fixed-assets/inquiries?type=depr-schedule'),
      ])
      if (!sumRes.ok) throw new Error('Failed to load summary')
      setSummary((await sumRes.json()).summary)
      setSchedule((await schedRes.json()).schedule)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Asset Inquiries</h1><p className="text-muted-foreground mt-1">Reports and insights on fixed assets</p></div>
        <motion.button onClick={fetchData} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><RefreshCw className="w-4 h-4" />Refresh</motion.button>
      </motion.div>

      <div className="flex gap-4 border-b border-border pb-2">
        <button onClick={() => setTab('summary')} className={`text-sm pb-2 px-1 ${tab === 'summary' ? 'text-primary border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}>Summary</button>
        <button onClick={() => setTab('schedule')} className={`text-sm pb-2 px-1 ${tab === 'schedule' ? 'text-primary border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}>Depreciation Schedule</button>
      </div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      ) : tab === 'summary' && summary ? (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Active Assets', value: String(summary.activeCount), color: '' },
            { label: 'Disposed/Sold', value: String(summary.disposedCount), color: '' },
            { label: 'Total Purchase Cost', value: formatCurrency(summary.totalPurchaseCost), color: '' },
            { label: 'Total Depreciation', value: formatCurrency(summary.totalDepreciation), color: 'text-yellow-600 dark:text-yellow-400' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-4">
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </motion.div>
          ))}
        </div>
      ) : tab === 'schedule' ? (
        <DataTable columns={[
          { key: 'assetNo', label: 'Asset No', sortable: true },
          { key: 'name', label: 'Name', sortable: true },
          { key: 'category', label: 'Category' },
          { key: 'purchaseCost', label: 'Cost', render: (_: unknown, row: DeprSchedule) => formatCurrency(row.purchaseCost) },
          { key: 'accumulatedDepr', label: 'Accum. Depr', render: (_: unknown, row: DeprSchedule) => formatCurrency(row.accumulatedDepr) },
          { key: 'netBookValue', label: 'NBV', render: (_: unknown, row: DeprSchedule) => formatCurrency(row.netBookValue) },
          { key: 'salvageValue', label: 'Salvage', render: (_: unknown, row: DeprSchedule) => formatCurrency(row.salvageValue) },
          { key: 'lastDepreciation', label: 'Last Depr' },
        ]} data={schedule} title="Depreciation Schedule" />
      ) : null}
    </div>
  )
}