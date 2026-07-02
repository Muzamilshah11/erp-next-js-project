'use client'

import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Account {
  id: string
  code: string
  name: string
  type: string
}

interface Transaction {
  date: string
  entryNo: string
  description: string
  debit: number
  credit: number
  balance: number
}

interface LedgerData {
  account: Account
  transactions: Transaction[]
  summary: {
    openingBalance: number
    totalDebit: number
    totalCredit: number
    closingBalance: number
  }
}

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [data, setData] = useState<LedgerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/finance/accounts')
      .then(res => res.json())
      .then(d => setAccounts(d.accounts))
  }, [])

  const fetchLedger = async () => {
    if (!selectedId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/finance/ledger?accountId=${selectedId}`)
      const d = await res.json()
      if (!res.ok) { setError(d.error); setData(null) }
      else { setData(d) }
    } catch {
      setError('Failed to load ledger')
    } finally {
      setLoading(false)
    }
  }

  const curr = (v: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(v)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            General Ledger
          </h1>
          <p className="text-muted-foreground mt-1">View account ledger details and transaction history</p>
        </div>
      </motion.div>

      {/* Account Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4"
      >
        <Filter className="w-5 h-5 text-muted-foreground" />
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select an account</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.code} — {a.name} ({a.type})</option>
          ))}
        </select>
        <motion.button
          onClick={fetchLedger}
          disabled={!selectedId || loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? 'Loading...' : 'View Ledger'}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Opening Balance', value: data.summary.openingBalance, color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30' },
              { label: 'Total Debits', value: data.summary.totalDebit, color: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800/30' },
              { label: 'Total Credits', value: data.summary.totalCredit, color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30' },
              { label: 'Closing Balance', value: data.summary.closingBalance, color: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/30' },
            ].map((card, idx) => (
              <motion.div
                key={card.label}
                className={`bg-gradient-to-br ${card.color} rounded-xl p-4 border`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.3 }}
                whileHover={{ y: -2 }}
              >
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold mt-2 ${card.value < 0 ? 'text-red-600' : 'text-foreground'}`}>
                  {curr(card.value)}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Ledger Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                {data.account.code} — {data.account.name}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Voucher #</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Debit</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Credit</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        No transactions found for this account
                      </td>
                    </tr>
                  ) : (
                    data.transactions.map((tx, idx) => (
                      <motion.tr
                        key={`${tx.entryNo}-${idx}`}
                        className="border-b border-border hover:bg-secondary/30 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02, duration: 0.2 }}
                      >
                        <td className="px-4 py-2 text-sm text-foreground">
                          {new Date(tx.date).toLocaleDateString('en-PK')}
                        </td>
                        <td className="px-4 py-2 text-sm font-mono text-primary">{tx.entryNo}</td>
                        <td className="px-4 py-2 text-sm text-foreground">{tx.description}</td>
                        <td className="px-4 py-2 text-sm text-right text-red-600">{tx.debit ? curr(tx.debit) : '-'}</td>
                        <td className="px-4 py-2 text-sm text-right text-green-600">{tx.credit ? curr(tx.credit) : '-'}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold">{curr(tx.balance)}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {!data && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-xl border border-border p-12 text-center shadow-sm"
          whileHover={{ y: -2 }}
        >
          <BookOpen className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">General Ledger</p>
          <p className="text-muted-foreground">Select an account and click &quot;View Ledger&quot; to see transaction history</p>
        </motion.div>
      )}
    </div>
  )
}
