'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800',
  draft: 'bg-yellow-100 text-yellow-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OutstandingPOsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/purchases/orders/outstanding')
      .then(r => r.json())
      .then(d => setOrders(d.outstanding ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Outstanding Purchase Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">POs with pending quantities to receive</p>
      </div>

      <DataTable
        columns={[
          { header: 'PO No', accessor: 'orderNo' },
          { header: 'Supplier', accessor: (o: any) => o.supplier?.name || '-' },
          { header: 'Date', accessor: (o: any) => format(new Date(o.date), 'dd MMM yyyy') },
          { header: 'Ordered', accessor: (o: any) => o.totalOrdered },
          { header: 'Received', accessor: (o: any) => o.totalReceived },
          {
            header: 'Balance',
            accessor: (o: any) => (
              <span className={o.balance > 0 ? 'text-amber-600 font-semibold' : 'text-green-600'}>
                {o.balance > 0 ? <><AlertTriangle className="w-3 h-3 inline mr-1" />{o.balance}</> : o.balance}
              </span>
            ),
          },
          {
            header: 'Status',
            accessor: (o: any) => <Badge className={statusColors[o.status] || ''}>{o.status}</Badge>,
          },
        ]}
        data={orders.filter(o => o.balance > 0)}
        loading={false}
        emptyMessage="All purchase orders are fully received"
      />
    </div>
  )
}
