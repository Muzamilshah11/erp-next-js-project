'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Download } from 'lucide-react'
import { useState } from 'react'

type ReportType = 'balance-sheet' | 'income-statement' | 'trial-balance'

interface ReportRow {
  code: string
  name: string
  type?: string
  debit?: number
  credit?: number
  balance?: number
  amount?: number
}

interface ReportData {
  type: ReportType
  date?: string
  from?: string
  to?: string
  rows?: ReportRow[]
  sections?: {
    assets?: { items: ReportRow[]; total: number }
    liabilities?: { items: ReportRow[]; total: number }
    equity?: { items: ReportRow[]; total: number }
    revenue?: { items: ReportRow[]; total: number }
    expenses?: { items: ReportRow[]; total: number }
  }
  totals?: { debit: number; credit: number }
  isBalanced?: boolean
  netIncome?: number
  totalLiabilitiesEquity?: number
}

const tabs: { key: ReportType; label: string }[] = [
  { key: 'trial-balance', label: 'Trial Balance' },
  { key: 'income-statement', label: 'Income Statement' },
  { key: 'balance-sheet', label: 'Balance Sheet' },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('trial-balance')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ type: reportType })
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)

      const res = await fetch(`/api/finance/reports?${params}`)
      const d = await res.json()
      if (!res.ok) { setError(d.error); setData(null) }
      else { setData(d) }
    } catch {
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const curr = (v: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(v)

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
            <BarChart3 className="w-8 h-8 text-primary" />
            Financial Reports
          </h1>
          <p className="text-muted-foreground mt-1">Generate and analyze financial statements</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-card rounded-xl border border-border p-1 shadow-sm flex gap-1"
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setReportType(tab.key); setData(null) }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              reportType === tab.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Date Filters + Generate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4"
      >
        {reportType === 'income-statement' && (
          <>
            <label className="text-sm text-muted-foreground">From:</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            <label className="text-sm text-muted-foreground">To:</label>
          </>
        )}
        <label className="text-sm text-muted-foreground">As of:</label>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        <motion.button
          onClick={fetchReport}
          disabled={loading}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </motion.button>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}</motion.div>
      )}

      <AnimatePresence mode="wait">
        {data && (
          <motion.div
            key={reportType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Summary Cards */}
            {reportType === 'balance-sheet' && data.sections && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard label="Total Assets" value={data.sections.assets?.total || 0} color="blue" />
                <SummaryCard label="Total Liabilities" value={data.sections.liabilities?.total || 0} color="amber" />
                <SummaryCard label="Total Equity" value={data.sections.equity?.total || 0} color="purple" />
              </div>
            )}
            {reportType === 'income-statement' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard label="Total Revenue" value={data.sections?.revenue?.total || 0} color="green" />
                <SummaryCard label="Total Expenses" value={data.sections?.expenses?.total || 0} color="red" />
                <SummaryCard label={`Net ${(data.netIncome || 0) >= 0 ? 'Income' : 'Loss'}`} value={data.netIncome || 0} color="blue" />
              </div>
            )}
            {reportType === 'trial-balance' && data.totals && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard label="Total Debits" value={data.totals.debit} color="red" />
                <SummaryCard label="Total Credits" value={data.totals.credit} color="green" />
                <SummaryCard label={data.isBalanced ? 'Balanced ✓' : 'Not Balanced ✗'} value={Math.abs(data.totals.debit - data.totals.credit)} color={data.isBalanced ? 'green' : 'red'} />
              </div>
            )}

            {/* Balance Sheet Detail */}
            {reportType === 'balance-sheet' && data.sections && (
              <ReportTable title="Assets" items={data.sections.assets?.items || []} total={data.sections.assets?.total || 0} valueKey="balance" />
            )}

            {/* Income Statement Detail */}
            {reportType === 'income-statement' && data.sections && (
              <>
                <ReportTable title="Revenue" items={data.sections.revenue?.items || []} total={data.sections.revenue?.total || 0} valueKey="amount" />
                <ReportTable title="Expenses" items={data.sections.expenses?.items || []} total={data.sections.expenses?.total || 0} valueKey="amount" />
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-secondary/30">
                    <h3 className="text-base font-semibold text-foreground">Net {data.netIncome && data.netIncome >= 0 ? 'Income' : 'Loss'}</h3>
                  </div>
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-sm font-semibold">{data.netIncome && data.netIncome >= 0 ? 'Net Income' : 'Net Loss'}</span>
                    <span className={`text-lg font-bold ${data.netIncome && data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {curr(Math.abs(data.netIncome || 0))}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Trial Balance Table */}
            {reportType === 'trial-balance' && data.rows && (
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Trial Balance</h3>
                  <span className="text-xs text-muted-foreground">{data.rows.length} accounts</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Code</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Account</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Type</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Debit</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Credit</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, idx) => (
                        <motion.tr
                          key={row.code}
                          className="border-b border-border hover:bg-secondary/30 transition-colors"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.01, duration: 0.15 }}
                        >
                          <td className="px-4 py-2 text-sm font-mono text-primary">{row.code}</td>
                          <td className="px-4 py-2 text-sm text-foreground">{row.name}</td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">{row.type}</td>
                          <td className="px-4 py-2 text-sm text-right text-red-600">{row.debit ? curr(row.debit) : '-'}</td>
                          <td className="px-4 py-2 text-sm text-right text-green-600">{row.credit ? curr(row.credit) : '-'}</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold">{curr(row.balance || 0)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                    {data.totals && (
                      <tfoot>
                        <tr className="bg-secondary/50 font-semibold">
                          <td colSpan={3} className="px-4 py-2 text-sm text-foreground">TOTAL</td>
                          <td className="px-4 py-2 text-sm text-right text-red-600">{curr(data.totals.debit)}</td>
                          <td className="px-4 py-2 text-sm text-right text-green-600">{curr(data.totals.credit)}</td>
                          <td className="px-4 py-2 text-sm text-right">{curr(data.totals.debit - data.totals.credit)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!data && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-xl border border-border p-12 text-center shadow-sm"
          whileHover={{ y: -2 }}
        >
          <BarChart3 className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">{tabs.find(t => t.key === reportType)?.label}</p>
          <p className="text-muted-foreground">Select a report type and click &quot;Generate Report&quot; to view financial data</p>
        </motion.div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30',
    red: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800/30',
    amber: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/30',
  }

  const curr = (v: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(v)

  return (
    <motion.div
      className={`bg-gradient-to-br ${colorMap[color]} rounded-xl p-4 border ${colorMap[color].split(' ')[2]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${value < 0 ? 'text-red-600' : 'text-foreground'}`}>{curr(value)}</p>
    </motion.div>
  )
}

function ReportTable({ title, items, total, valueKey }: { title: string; items: ReportRow[]; total: number; valueKey: 'balance' | 'amount' }) {
  const curr = (v: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(v)

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Code</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Account</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-sm">No {title.toLowerCase()} found</td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <motion.tr
                  key={item.code}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.15 }}
                >
                  <td className="px-4 py-2 text-sm font-mono text-primary">{item.code}</td>
                  <td className="px-4 py-2 text-sm text-foreground">{item.name}</td>
                  <td className="px-4 py-2 text-sm text-right font-semibold">{curr(item[valueKey] || 0)}</td>
                </motion.tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-secondary/50 font-semibold">
              <td colSpan={2} className="px-4 py-2 text-sm text-foreground">Total {title}</td>
              <td className="px-4 py-2 text-sm text-right">{curr(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
