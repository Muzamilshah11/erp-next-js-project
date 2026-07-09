'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

export default function PurchasesCreditNotesPage() {
  const router = useRouter()
  const [creditNotes, setCreditNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/purchases/credit-notes')
      .then(r => r.json())
      .then(d => setCreditNotes(d.creditNotes ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Supplier Credit Notes</h1><p className="text-sm text-muted-foreground mt-1">Credit notes from suppliers</p></div>
        <Button onClick={() => router.push('/purchases/credit-notes/new')}><Plus className="w-4 h-4 mr-2" /> New Credit Note</Button>
      </div>
      <DataTable
        columns={[
          { key: 'creditNoteNo', label: 'Credit Note No' },
          { key: 'supplier', label: 'Supplier', render: (v: any, cn: any) => cn.supplier?.name || '-' },
          { key: 'date', label: 'Date', render: (v: any, cn: any) => format(new Date(cn.date), 'dd MMM yyyy') },
          { key: 'amount', label: 'Amount', render: (v: any, cn: any) => formatCurrency(cn.amount) },
          { key: 'reason', label: 'Reason' },
          { key: 'status', label: 'Status', render: (v: any, cn: any) => <Badge variant="outline">{cn.status}</Badge> },
          { key: 'id', label: '', render: (v: any, cn: any) => <Button variant="ghost" size="sm" onClick={() => router.push(`/purchases/credit-notes/${cn.id}`)}>View</Button> },
        ]}
        data={creditNotes}
        emptyMessage="No credit notes found"
      />
    </div>
  )
}
