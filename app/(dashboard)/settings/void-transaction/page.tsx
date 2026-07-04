'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Search, Loader2, RotateCcw, AlertTriangle } from 'lucide-react'

export default function VoidTransactionPage() {
  const [entityType, setEntityType] = useState('invoice')
  const [searchTerm, setSearchTerm] = useState('')
  const [result, setResult] = useState<{ id: string; ref: string; date: string; amount: number; status: string } | null>(null)
  const [searching, setSearching] = useState(false); const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [voiding, setVoiding] = useState(false); const [success, setSuccess] = useState('')

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setSearching(true); setError(''); setResult(null)
    try {
      const apiPath = entityType === 'invoice' ? '/api/sales/invoices' : entityType === 'bill' ? '/api/purchases/bills' : '/api/finance/journal-entries'
      const res = await fetch(apiPath); const data = await res.json()
      const items = entityType === 'invoice' ? (data.invoices || []) : entityType === 'bill' ? (data.bills || []) : (data.entries || [])
      const found = items.find((i: Record<string, unknown>) => {
        const ref = String(i.invoiceNo || i.billNo || i.entryNo || '')
        return ref.toLowerCase().includes(searchTerm.toLowerCase())
      })
      if (found) setResult({
        id: found.id,
        ref: String(found.invoiceNo || found.billNo || found.entryNo || ''),
        date: String(found.date || found.createdAt || ''),
        amount: found.amount || found.totalDebit || found.totalCredit || 0,
        status: String(found.status || ''),
      })
      else setError('No transaction found with that reference')
    } catch { setError('Search failed') } finally { setSearching(false) }
  }

  const handleVoid = async () => {
    if (!result || !reason.trim()) return
    setVoiding(true); setError(''); setSuccess('')
    try {
      const voidPath = entityType === 'invoice' ? '/api/setup/void/invoice' : entityType === 'bill' ? '/api/setup/void/bill' : '/api/setup/void/journal-entry'
      const res = await fetch(`${voidPath}/${result.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      setSuccess(`Successfully voided ${entityType} ${result.ref}`)
      setResult(null); setReason('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to void') }
    finally { setVoiding(false) }
  }

  const entityLabel = entityType === 'invoice' ? 'Invoice' : entityType === 'bill' ? 'Bill' : 'Journal Entry'

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><RotateCcw className="w-8 h-8 text-destructive" /> Void Transaction</h1>
        <p className="text-muted-foreground mt-1">Reverse posted invoices, bills, and journal entries with audit trail</p>
      </motion.div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex gap-3">
          <select value={entityType} onChange={e => { setEntityType(e.target.value); setResult(null); setError('') }} className="px-3 py-2 border border-input rounded-lg text-sm bg-background">
            <option value="invoice">Invoice</option><option value="bill">Bill</option><option value="journal-entry">Journal Entry</option>
          </select>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search by Invoice/Bill/Entry No..." className="flex-1 px-3 py-2 border border-input rounded-lg text-sm bg-background" />
          <button onClick={handleSearch} disabled={searching} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Search
          </button>
        </div>

        {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}
        {success && <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">{success}</div>}

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{entityLabel}: {result.ref}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${result.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{result.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(result.date).toLocaleDateString('en-PK')}</span></div>
              <div><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{result.amount.toLocaleString()}</span></div>
            </div>
            {result.status === 'posted' ? (
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-sm font-medium flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-destructive" /> Void Reason *</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Explain why this transaction is being voided..." className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" />
                <button onClick={handleVoid} disabled={voiding || !reason.trim()} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-1">
                  {voiding ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Void {entityLabel}
                </button>
              </div>
            ) : <p className="text-sm text-muted-foreground">Only posted transactions can be voided.</p>}
          </motion.div>
        )}
      </div>
    </div>
  )
}
