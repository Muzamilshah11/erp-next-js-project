'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Transaction { id: string; type: string; date: string; description: string | null; amount: number; status: string; asset: { id: string; name: string; assetNo: string } }

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('')

  const fetchTransactions = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType)
      const res = await fetch(`/api/fixed-assets/transactions?${params}`); const d = await res.json()
      if (!res.ok) throw new Error(d.error); setTransactions(d.transactions)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTransactions() }, [])

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Asset Transactions</h1>
        <p className="text-muted-foreground mt-1">View all asset transactions</p>
      </motion.div>

      <div className="flex gap-4 items-end">
        <div><label className="block text-sm text-muted-foreground mb-1">Filter by Type</label><select value={filterType} onChange={e => { setFilterType(e.target.value) }} className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"><option value="">All Types</option><option value="purchase">Purchase</option><option value="transfer">Transfer</option><option value="disposal">Disposal</option><option value="sale">Sale</option><option value="adjustment">Adjustment</option><option value="maintenance">Maintenance</option></select></div>
        <button onClick={fetchTransactions} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Filter</button>
      </div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading transactions...</p></div>
      ) : (
        <DataTable columns={[
          { key: 'date', label: 'Date', sortable: true, render: (_: unknown, row: Transaction) => new Date(row.date).toLocaleDateString() },
          { key: 'asset.assetNo', label: 'Asset No' },
          { key: 'asset.name', label: 'Asset Name' },
          { key: 'type', label: 'Type' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount', render: (_: unknown, row: Transaction) => `$${row.amount.toLocaleString()}` },
          { key: 'status', label: 'Status' },
        ]} data={transactions} title="All Transactions" />
      )}
    </div>
  )
}