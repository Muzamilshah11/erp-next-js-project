'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  issued: 'bg-green-100 text-green-800',
  allocated: 'bg-blue-100 text-blue-800',
}

export default function SalesCreditNotesPage() {
  const router = useRouter()
  const [creditNotes, setCreditNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    fetch('/api/sales/credit-notes')
      .then(res => res.json())
      .then(data => setCreditNotes(data.creditNotes ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Credit Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">Customer credit notes and returns</p>
        </div>
        <Button onClick={() => router.push('/sales/credit-notes/new')}>
          <Plus className="w-4 h-4 mr-2" /> New Credit Note
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'creditNoteNo', label: 'Credit Note No' },
          { key: 'customer', label: 'Customer', render: (v: any, cn: any) => cn.customer?.name || '-' },
          { key: 'date', label: 'Date', render: (v: any, cn: any) => format(new Date(cn.date), 'dd MMM yyyy') },
          { key: 'amount', label: 'Amount', render: (v: any, cn: any) => formatCurrency(cn.amount) },
          { key: 'reason', label: 'Reason' },
          {
            key: 'status',
            label: 'Status',
            render: (v: any, cn: any) => <Badge className={statusColors[cn.status] || ''}>{cn.status}</Badge>,
          },
          {
            key: 'id',
            label: '',
            render: (v: any, cn: any) => (
              <Button variant="ghost" size="sm" onClick={() => router.push(`/sales/credit-notes/${cn.id}`)}>
                View
              </Button>
            ),
          },
        ]}
        data={creditNotes}
        emptyMessage="No credit notes found"
      />
    </div>
  )
}
