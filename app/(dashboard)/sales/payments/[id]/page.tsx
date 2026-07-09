'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function SalesPaymentDetailPage() {
  const params = useParams()
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sales/payments/${params.id}`)
      .then(r => r.json())
      .then(d => setPayment(d.payment))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!payment) return <div className="text-center text-muted-foreground py-12">Payment not found.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/sales/payments" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{payment.paymentNo}</h1>
          <Badge className={statusColors[payment.status] || ''}>{payment.status}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm font-medium">{payment.customer?.name}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Date</p><p className="text-sm font-medium">{format(new Date(payment.date), 'dd MMM yyyy')}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Amount</p><p className="text-sm font-medium">{formatCurrency(payment.amount)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Method</p><p className="text-sm font-medium">{payment.paymentMethod}</p></Card>
      </div>
      {payment.allocations?.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Allocations</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2">Invoice</th><th className="pb-2 text-right">Amount</th></tr></thead>
            <tbody>{payment.allocations.map((a: any) => <tr key={a.id} className="border-b last:border-0"><td className="py-2">{a.invoice?.invoiceNo || '-'}</td><td className="py-2 text-right">{formatCurrency(a.amount)}</td></tr>)}</tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
