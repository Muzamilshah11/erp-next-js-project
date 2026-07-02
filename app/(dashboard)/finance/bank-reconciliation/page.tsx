'use client'

import { motion } from 'framer-motion'
import { CreditCard, Plus, ArrowRight, CheckCircle2, X, RotateCcw } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Account {
  id: string
  code: string
  name: string
  type: string
}

interface BankTransaction {
  id: string
  accountId: string
  date: string
  description: string
  reference: string | null
  debit: number
  credit: number
  balance: number
  reconciled: boolean
}

export default function BankReconciliationPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', description: '', reference: '', debit: '', credit: '' })

  const fetchAccounts = async () => {
    const res = await fetch('/api/finance/accounts')
    const d = await res.json()
    const bankAccounts = d.accounts.filter((a: Account) =>
      a.name.toLowerCase().includes('bank') || a.type === 'Asset'
    )
    setAccounts(d.accounts)
    if (bankAccounts.length > 0 && !selectedId) {
      setSelectedId(bankAccounts[0].id)
    }
  }

  const fetchTransactions = async (accountId: string) => {
    if (!accountId) return
    const res = await fetch(`/api/finance/bank-transactions?accountId=${accountId}`)
    const d = await res.json()
    setTransactions(d.transactions)
  }

  useEffect(() => { fetchAccounts() }, [])

  useEffect(() => {
    if (selectedId) fetchTransactions(selectedId)
  }, [selectedId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/finance/bank-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: selectedId,
        date: form.date,
        description: form.description,
        reference: form.reference || null,
        debit: parseFloat(form.debit) || 0,
        credit: parseFloat(form.credit) || 0,
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ date: '', description: '', reference: '', debit: '', credit: '' })
      fetchTransactions(selectedId)
    }
  }

  const toggleReconcile = async (tx: BankTransaction) => {
    await fetch(`/api/finance/bank-transactions/${tx.id}/reconcile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reconciled: !tx.reconciled }),
    })
    fetchTransactions(selectedId)
  }

  const deleteTx = async (id: string) => {
    if (window.confirm('Delete this transaction?')) {
      await fetch(`/api/finance/bank-transactions/${id}`, { method: 'DELETE' })
      fetchTransactions(selectedId)
    }
  }

  const curr = (v: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(v)

  const statementBalance = transactions.reduce((s, t) => s + t.debit - t.credit, 0)
  const reconciledBalance = transactions.filter(t => t.reconciled).reduce((s, t) => s + t.debit - t.credit, 0)
  const unreconciledCount = transactions.filter(t => !t.reconciled).length

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
            <CreditCard className="w-8 h-8 text-primary" />
            Bank Reconciliation
          </h1>
          <p className="text-muted-foreground mt-1">Match bank statement transactions with your accounts</p>
        </div>
      </motion.div>

      {/* Account Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4"
      >
        <CreditCard className="w-5 h-5 text-muted-foreground" />
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select bank account</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.code} — {a.name} ({a.type})</option>
          ))}
        </select>
        <motion.button
          onClick={() => { setShowForm(!showForm); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      {selectedId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Statement Balance', value: statementBalance, color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30' },
            { label: 'Reconciled', value: reconciledBalance, color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30' },
            { label: 'Difference', value: statementBalance - reconciledBalance, color: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800/30' },
            { label: 'Unreconciled Items', value: unreconciledCount, color: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30' },
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
              <p className={`text-2xl font-bold mt-2 ${typeof card.value === 'number' && card.value < 0 ? 'text-red-600' : 'text-foreground'}`}>
                {typeof card.value === 'number' ? curr(card.value) : card.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Transaction Form */}
      {showForm && (
        <motion.form
          onSubmit={handleAdd}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Add Bank Transaction</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="text" placeholder="Reference (optional)" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required className="col-span-2 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="number" placeholder="Debit Amount" value={form.debit} onChange={e => setForm({ ...form, debit: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="number" placeholder="Credit Amount" value={form.credit} onChange={e => setForm({ ...form, credit: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow">Add Transaction</button>
          </div>
        </motion.form>
      )}

      {/* Transactions Table */}
      {selectedId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Bank Statement Entries</h3>
            <span className="text-xs text-muted-foreground">{transactions.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Reference</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Debit</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Credit</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Balance</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-foreground">Reconciled</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No transactions yet. Add a bank statement entry to get started.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => (
                    <motion.tr
                      key={tx.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${tx.reconciled ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                    >
                      <td className="px-4 py-2 text-sm text-foreground">{new Date(tx.date).toLocaleDateString('en-PK')}</td>
                      <td className="px-4 py-2 text-sm text-foreground">{tx.description}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{tx.reference || '-'}</td>
                      <td className="px-4 py-2 text-sm text-right text-red-600">{tx.debit ? curr(tx.debit) : '-'}</td>
                      <td className="px-4 py-2 text-sm text-right text-green-600">{tx.credit ? curr(tx.credit) : '-'}</td>
                      <td className="px-4 py-2 text-sm text-right font-semibold">{curr(tx.balance)}</td>
                      <td className="px-4 py-2 text-sm text-center">
                        <motion.button
                          onClick={() => toggleReconcile(tx)}
                          className={`p-1 rounded-lg transition-colors ${tx.reconciled ? 'text-green-600 bg-green-100 dark:bg-green-900/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title={tx.reconciled ? 'Unmark reconciled' : 'Mark as reconciled'}
                        >
                          {tx.reconciled ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                        </motion.button>
                      </td>
                      <td className="px-4 py-2 text-sm text-center">
                        <motion.button
                          onClick={() => deleteTx(tx.id)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {!selectedId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-xl border border-border p-12 text-center shadow-sm"
          whileHover={{ y: -2 }}
        >
          <CreditCard className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Bank Reconciliation</p>
          <p className="text-muted-foreground">Select a bank account above to start reconciling transactions</p>
        </motion.div>
      )}
    </div>
  )
}
