'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  issued: 'bg-green-100 text-green-800',
  allocated: 'bg-blue-100 text-blue-800',
}

export default function SalesCreditNoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [creditNote, setCreditNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)

  useEffect(() => {
    fetch(`/api/sales/credit-notes/${params.id}`)
      .then(r => r.json())
      .then(d => setCreditNote(d.creditNote))
      .finally(() => setLoading(false))
  }, [params.id])

  const handleIssue = async () => {
    setIssuing(true)
    try {
      const res = await fetch(`/api/sales/credit-notes/${params.id}/issue`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setCreditNote((prev: any) => ({ ...prev, status: 'issued' }))
      }
    } finally {
      setIssuing(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!creditNote) return <div className="text-center text-muted-foreground py-12">Credit note not found.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sales/credit-notes" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{creditNote.creditNoteNo}</h1>
              <Badge className={statusColors[creditNote.status] || ''}>{creditNote.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Customer: {creditNote.customer?.name}</p>
          </div>
        </div>
        {creditNote.status === 'draft' && (
          <Button onClick={handleIssue} disabled={issuing}>
            {issuing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Issue Credit Note
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Date</p>
          <p className="text-sm font-medium">{format(new Date(creditNote.date), 'dd MMM yyyy')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="text-sm font-medium">{formatCurrency(creditNote.amount)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Reason</p>
          <p className="text-sm font-medium">{creditNote.reason || '-'}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2">Item</th>
              <th className="pb-2">Warehouse</th>
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Price</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {creditNote.items?.map((item: any) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2">{item.item?.name || '-'}</td>
                <td className="py-2">{item.warehouse?.name || '-'}</td>
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                <td className="py-2 text-right">{formatCurrency(item.quantity * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {creditNote.allocations?.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Allocations</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Invoice</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {creditNote.allocations.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2">{a.invoice?.invoiceNo || '-'}</td>
                  <td className="py-2 text-right">{formatCurrency(a.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
