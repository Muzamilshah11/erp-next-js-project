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
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function SalesPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sales/payments')
      .then(r => r.json())
      .then(d => setPayments(d.payments ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Customer payments received</p>
        </div>
        <Button onClick={() => router.push('/sales/payments/new')}>
          <Plus className="w-4 h-4 mr-2" /> New Payment
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'paymentNo', label: 'Payment No' },
          { key: 'customer', label: 'Customer', render: (v: any, p: any) => p.customer?.name || '-' },
          { key: 'date', label: 'Date', render: (v: any, p: any) => format(new Date(p.date), 'dd MMM yyyy') },
          { key: 'amount', label: 'Amount', render: (v: any, p: any) => formatCurrency(p.amount) },
          { key: 'paymentMethod', label: 'Method' },
          { key: 'reference', label: 'Reference' },
          { key: 'status', label: 'Status', render: (v: any, p: any) => <Badge className={statusColors[p.status] || ''}>{p.status}</Badge> },
          { key: 'id', label: '', render: (v: any, p: any) => <Button variant="ghost" size="sm" onClick={() => router.push(`/sales/payments/${p.id}`)}>View</Button> },
        ]}
        data={payments}
        emptyMessage="No payments found"
      />
    </div>
  )
}
