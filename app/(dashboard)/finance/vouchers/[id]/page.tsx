'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, Loader2, Play } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

const typeLabels: Record<string, string> = {
  journal: 'Journal Entry',
  'bank-payment': 'Bank Payment',
  'bank-deposit': 'Bank Deposit',
  'cash-payment': 'Cash Payment',
  'cash-receipt': 'Cash Receipt',
  'bank-transfer': 'Bank Transfer',
  bulk: 'Bulk',
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  posted: 'bg-green-100 text-green-800',
}

export default function VoucherDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    fetch(`/api/finance/vouchers/${params.id}`)
      .then(r => r.json())
      .then(d => setEntry(d.entry))
      .finally(() => setLoading(false))
  }, [params.id])

  const handleProcess = async () => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/finance/vouchers/${params.id}/process`, { method: 'POST' })
      const data = await res.json()
      if (data.entry) setEntry(data.entry)
    } finally { setProcessing(false) }
  }

  const handleClearCheque = async () => {
    setClearing(true)
    try {
      const res = await fetch(`/api/finance/vouchers/${params.id}/clear-cheque`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clearedDate: new Date().toISOString() }) })
      const data = await res.json()
      if (data.entry) setEntry(data.entry)
    } finally { setClearing(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this voucher?')) return
    await fetch(`/api/finance/vouchers/${params.id}`, { method: 'DELETE' })
    router.push('/finance/vouchers')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!entry) return <div className="text-center text-muted-foreground py-12">Voucher not found.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/vouchers" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{entry.entryNo}</h1>
              <Badge className={statusColors[entry.status] || ''}>{entry.status}</Badge>
              <Badge variant="outline">{typeLabels[entry.type] || entry.type}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {entry.status === 'draft' && (
            <>
              <Button variant="outline" onClick={handleDelete}>Delete</Button>
              <Button onClick={handleProcess} disabled={processing}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Process
              </Button>
            </>
          )}
          {entry.isCheque && !entry.isCleared && entry.status === 'posted' && (
            <Button onClick={handleClearCheque} disabled={clearing}>
              {clearing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Clear Cheque
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Date</p><p className="text-sm font-medium">{format(new Date(entry.date), 'dd MMM yyyy')}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total Debit</p><p className="text-sm font-medium">{formatCurrency(entry.totalDebit)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total Credit</p><p className="text-sm font-medium">{formatCurrency(entry.totalCredit)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Payee</p><p className="text-sm font-medium">{entry.payee || '-'}</p></Card>
      </div>

      {entry.description && (
        <Card className="p-4"><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{entry.description}</p></Card>
      )}

      {entry.chequeNo && (
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Cheque Info</p>
          <p className="text-sm">No: {entry.chequeNo} | Date: {entry.chequeDate ? format(new Date(entry.chequeDate), 'dd MMM yyyy') : '-'} | Cleared: {entry.isCleared ? (entry.clearedDate ? format(new Date(entry.clearedDate), 'dd MMM yyyy') : 'Yes') : 'No'}</p>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Lines</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2">Account</th>
              <th className="pb-2">Code</th>
              <th className="pb-2 text-right">Debit</th>
              <th className="pb-2 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {entry.lines?.map((line: any) => (
              <tr key={line.id} className="border-b last:border-0">
                <td className="py-2">{line.account?.name || '-'}</td>
                <td className="py-2">{line.account?.code || '-'}</td>
                <td className="py-2 text-right">{line.debit ? formatCurrency(line.debit) : '-'}</td>
                <td className="py-2 text-right">{line.credit ? formatCurrency(line.credit) : '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t">
              <td className="pt-2" colSpan={2}>Total</td>
              <td className="pt-2 text-right">{formatCurrency(entry.totalDebit)}</td>
              <td className="pt-2 text-right">{formatCurrency(entry.totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  )
}
