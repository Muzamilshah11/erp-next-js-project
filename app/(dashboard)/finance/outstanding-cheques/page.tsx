'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

export default function OutstandingChequesPage() {
  const [cheques, setCheques] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clearingId, setClearingId] = useState<string | null>(null)

  const fetchCheques = () => {
    fetch('/api/finance/vouchers/outstanding-cheques')
      .then(r => r.json())
      .then(d => setCheques(d.cheques ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCheques() }, [])

  const handleClear = async (id: string) => {
    setClearingId(id)
    try {
      await fetch(`/api/finance/vouchers/${id}/clear-cheque`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clearedDate: new Date().toISOString() }) })
      fetchCheques()
    } finally { setClearingId(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Outstanding Cheques</h1>
        <p className="text-sm text-muted-foreground mt-1">Issued cheques that have not cleared yet</p>
      </div>

      <DataTable
        columns={[
          { key: 'date', label: 'Date', render: (v: any, c: any) => format(new Date(c.date), 'dd MMM yyyy') },
          { key: 'chequeNo', label: 'Cheque No' },
          { key: 'entryNo', label: 'Voucher' },
          { key: 'payee', label: 'Payee' },
          { key: 'description', label: 'Description' },
          { key: 'bankAccount', label: 'Bank Account' },
          { key: 'amount', label: 'Amount', render: (v: any, c: any) => formatCurrency(c.amount) },
          {
            key: 'id',
            label: '',
            render: (v: any, c: any) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleClear(c.id)}
                disabled={clearingId === c.id}
              >
                {clearingId === c.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                Clear
              </Button>
            ),
          },
        ]}
        data={cheques}
        emptyMessage="No outstanding cheques"
      />
    </div>
  )
}
