'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Loader2, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function InquiriesPage() {
  const [tab, setTab] = useState<'tickets' | 'tasks' | 'queries'>('tickets')
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true); setError('')
    try { const res = await fetch(`/api/crm/inquiries?type=${tab}`); const d = await res.json(); if (!res.ok) throw new Error(d.error); setData(d.inquiry) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [tab])

  const statusColors: Record<string, string> = { open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', 'in-progress': 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', resolved: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">CRM Inquiries</h1><p className="text-muted-foreground mt-1">Reports and insights</p></div>
        <motion.button onClick={fetchData} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><RefreshCw className="w-4 h-4" />Refresh</motion.button>
      </motion.div>

      <div className="flex gap-4 border-b border-border pb-2">
        {(['tickets', 'tasks', 'queries'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`text-sm pb-2 px-1 capitalize ${tab === t ? 'text-primary border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}>{t} Inquiry</button>
        ))}
      </div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
      ) : data ? (
        <div className="space-y-6">
          {tab === 'tickets' && (
            <>
              <div className="grid grid-cols-4 gap-4">
                {[{ label: 'Total Tickets', value: String((data as { total?: number }).total ?? 0) }, { label: 'Pending', value: String((data as { open?: number }).open ?? 0) }, { label: 'High Priority', value: String((data as { resolved?: number }).resolved ?? 0) }, { label: 'Closed', value: String((data as { closed?: number }).closed ?? 0) }].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                    <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  </motion.div>
                ))}
              </div>
              {data && (data as { recent?: unknown[] }).recent && (
                <DataTable columns={[
                  { key: 'ticketNo', label: 'Ticket' },
                  { key: 'subject', label: 'Subject' },
                  { key: 'customer.name', label: 'Customer' },
                  { key: 'assignee.fullName', label: 'Agent' },
                  { key: 'status.name', label: 'Status', render: (_: unknown, row: Record<string, unknown>) => <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: (row.status as Record<string, string>).color + '20', color: (row.status as Record<string, string>).color }}>{(row.status as Record<string, string>).name}</span> },
                  { key: 'createdAt', label: 'Date', render: (_: unknown, row: Record<string, unknown>) => new Date(row.createdAt as string).toLocaleDateString() },
                ]} data={(data as { recent: unknown[] }).recent} title="Recent Tickets" />
              )}
            </>
          )}

          {tab === 'tasks' && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4"><div className="text-sm text-muted-foreground">Total Tasks</div><div className="text-2xl font-bold text-foreground">{(data as { total?: number }).total ?? 0}</div></motion.div>
              </div>
              {data && (data as { recent?: unknown[] }).recent && (
                <DataTable columns={[
                  { key: 'taskNo', label: 'Task No' },
                  { key: 'title', label: 'Title' },
                  { key: 'assignee.fullName', label: 'Assignee' },
                  { key: 'status.name', label: 'Status', render: (_: unknown, row: Record<string, unknown>) => <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: (row.status as Record<string, string>).color + '20', color: (row.status as Record<string, string>).color }}>{(row.status as Record<string, string>).name}</span> },
                ]} data={(data as { recent: unknown[] }).recent} title="Recent Tasks" />
              )}
            </>
          )}

          {tab === 'queries' && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4"><div className="text-sm text-muted-foreground">Total Queries</div><div className="text-2xl font-bold text-foreground">{(data as { total?: number }).total ?? 0}</div></motion.div>
              </div>
              {data && (data as { byStatus?: { status: string; _count: number }[] }).byStatus && (
                <div className="grid grid-cols-4 gap-4">
                  {(data as { byStatus: { status: string; _count: number }[] }).byStatus.map((s, i) => (
                    <motion.div key={s.status} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-4">
                      <div className="text-sm text-muted-foreground capitalize">{s.status}</div>
                      <div className="text-2xl font-bold text-foreground">{s._count}</div>
                    </motion.div>
                  ))}
                </div>
              )}
              {data && (data as { recent?: unknown[] }).recent && (
                <DataTable columns={[
                  { key: 'queryNo', label: 'Query No' },
                  { key: 'subject', label: 'Subject' },
                  { key: 'customer.name', label: 'Customer' },
                  { key: 'assignee.fullName', label: 'Assignee' },
                  { key: 'source.name', label: 'Source' },
                  { key: 'status', label: 'Status', render: (_: unknown, row: Record<string, unknown>) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[row.status as string] || ''}`}>{row.status as string}</span> },
                ]} data={(data as { recent: unknown[] }).recent} title="Recent Queries" />
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}