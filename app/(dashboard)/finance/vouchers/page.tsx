'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

const typeLabels: Record<string, string> = {
  journal: 'Journal',
  'bank-payment': 'Bank Payment',
  'bank-deposit': 'Bank Deposit',
  'cash-payment': 'Cash Payment',
  'cash-receipt': 'Cash Receipt',
  'bank-transfer': 'Bank Transfer',
  bulk: 'Bulk',
}

const typeColors: Record<string, string> = {
  journal: 'bg-gray-100 text-gray-800',
  'bank-payment': 'bg-red-100 text-red-800',
  'bank-deposit': 'bg-green-100 text-green-800',
  'cash-payment': 'bg-orange-100 text-orange-800',
  'cash-receipt': 'bg-emerald-100 text-emerald-800',
  'bank-transfer': 'bg-blue-100 text-blue-800',
  bulk: 'bg-purple-100 text-purple-800',
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  posted: 'bg-green-100 text-green-800',
}

export default function VouchersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const defaultTab = searchParams.get('status') || 'all'
  const [tab, setTab] = useState(defaultTab)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tab !== 'all') params.set('status', tab)
    fetch(`/api/finance/vouchers?${params}`)
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vouchers</h1>
          <p className="text-sm text-muted-foreground mt-1">Bank & Cash vouchers, journal entries, and transfers</p>
        </div>
        <Button onClick={() => router.push('/finance/vouchers/new')}>
          <Plus className="w-4 h-4 mr-2" /> New Voucher
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="posted">Posted</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <DataTable
            columns={[
              { key: 'entryNo', label: 'Entry No' },
              { key: 'type', label: 'Type', render: (v: any, e: any) => <Badge className={typeColors[e.type] || ''}>{typeLabels[e.type] || e.type}</Badge> },
              { key: 'date', label: 'Date', render: (v: any, e: any) => format(new Date(e.date), 'dd MMM yyyy') },
              { key: 'description', label: 'Description' },
              { key: 'payee', label: 'Payee', render: (v: any, e: any) => e.payee || '-' },
              { key: 'totalDebit', label: 'Debit', render: (v: any, e: any) => formatCurrency(e.totalDebit) },
              { key: 'totalCredit', label: 'Credit', render: (v: any, e: any) => formatCurrency(e.totalCredit) },
              { key: 'status', label: 'Status', render: (v: any, e: any) => <Badge className={statusColors[e.status] || ''}>{e.status}</Badge> },
              {
                key: 'id',
                label: '',
                render: (v: any, e: any) => (
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/finance/vouchers/${e.id}`)}>
                    View
                  </Button>
                ),
              },
            ]}
            data={entries}
            emptyMessage="No vouchers found"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
