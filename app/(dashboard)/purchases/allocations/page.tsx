'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function PurchaseAllocationsPage() {
  const [allocationType, setAllocationType] = useState<'payment' | 'creditNote'>('payment')
  const [supplierId, setSupplierId] = useState('')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [selectedPaymentId, setSelectedPaymentId] = useState('')
  const [creditNotes, setCreditNotes] = useState<any[]>([])
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState('')
  const [bills, setBills] = useState<any[]>([])
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/purchases/suppliers').then(r => r.json()).then(d => setSuppliers(d.suppliers ?? [])) }, [])

  const loadData = async (sid: string) => {
    setLoading(true)
    const [pRes, cnRes, bRes] = await Promise.all([
      fetch(`/api/purchases/payments?supplierId=${sid}`),
      fetch(`/api/purchases/credit-notes?supplierId=${sid}`),
      fetch(`/api/purchases/bills?supplierId=${sid}`),
    ])
    const pData = await pRes.json()
    const cnData = await cnRes.json()
    const bData = await bRes.json()
    setPayments(pData.payments ?? [])
    setCreditNotes(cnData.creditNotes ?? [])
    setBills((bData.bills ?? []).filter((b: any) => b.status !== 'paid' && b.amount > b.paid))
    setLoading(false)
  }

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (v || 0), 0)
  const selectedSource = allocationType === 'payment'
    ? payments.find(p => p.id === selectedPaymentId)
    : creditNotes.find(cn => cn.id === selectedCreditNoteId)
  const sourceAmount = selectedSource?.amount || 0
  const remaining = sourceAmount - totalAllocated

  const handleSave = async () => {
    setSaving(true)
    try {
      const billAllocations = Object.entries(allocations).filter(([_, amt]) => amt > 0).map(([billId, amount]) => ({ billId, amount }))
      const body: any = allocationType === 'payment'
        ? { paymentId: selectedPaymentId, billAllocations }
        : { creditNoteId: selectedCreditNoteId, billAllocations }
      await fetch('/api/purchases/allocations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setAllocations({})
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/purchases" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-semibold">Bill Allocations</h1><p className="text-sm text-muted-foreground mt-1">Allocate payments or credit notes to bills</p></div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select value={supplierId} onValueChange={(v) => { if (v) { setSupplierId(v); loadData(v) } }}>
            <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Allocation Type</Label>
          <div className="flex gap-2">
            <Button variant={allocationType === 'payment' ? 'default' : 'outline'} size="sm" onClick={() => setAllocationType('payment')}>Payment</Button>
            <Button variant={allocationType === 'creditNote' ? 'default' : 'outline'} size="sm" onClick={() => setAllocationType('creditNote')}>Credit Note</Button>
          </div>
        </div>
        {allocationType === 'payment' ? (
          <div className="space-y-2">
            <Label>Select Payment</Label>
            <Select value={selectedPaymentId} onValueChange={(v) => v && setSelectedPaymentId(v)}>
              <SelectTrigger><SelectValue placeholder="Select payment" /></SelectTrigger>
              <SelectContent>{payments.filter(p => p.status === 'completed').map(p => <SelectItem key={p.id} value={p.id}>{p.paymentNo} - {formatCurrency(p.amount)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Select Credit Note</Label>
            <Select value={selectedCreditNoteId} onValueChange={(v) => v && setSelectedCreditNoteId(v)}>
              <SelectTrigger><SelectValue placeholder="Select credit note" /></SelectTrigger>
              <SelectContent>{creditNotes.map(cn => <SelectItem key={cn.id} value={cn.id}>{cn.creditNoteNo} - {formatCurrency(cn.amount)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </Card>

      {loading && <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}

      {bills.length > 0 && (selectedPaymentId || selectedCreditNoteId) && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Outstanding Bills</h2>
            <p className="text-sm text-muted-foreground">Remaining: {formatCurrency(remaining)}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Bill</th><th className="pb-2 text-right">Amount</th><th className="pb-2 text-right">Paid</th><th className="pb-2 text-right">Due</th><th className="pb-2 text-right w-40">Allocate</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => {
                const due = bill.amount - bill.paid
                return (
                  <tr key={bill.id} className="border-b last:border-0">
                    <td className="py-2">{bill.billNo}</td>
                    <td className="py-2 text-right">{formatCurrency(bill.amount)}</td>
                    <td className="py-2 text-right">{formatCurrency(bill.paid)}</td>
                    <td className="py-2 text-right">{formatCurrency(due)}</td>
                    <td className="py-2 text-right">
                      <Input type="number" min={0} max={due} step="0.01" className="w-28 ml-auto text-right"
                        value={allocations[bill.id] || ''}
                        onChange={e => { const val = Number(e.target.value); setAllocations(prev => ({ ...prev, [bill.id]: val > due ? due : val })) }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-muted-foreground">Total to allocate: {formatCurrency(totalAllocated)}</p>
            <Button onClick={handleSave} disabled={saving || totalAllocated <= 0}>{saving ? 'Saving...' : 'Save Allocations'}</Button>
          </div>
        </Card>
      )}

      {bills.length === 0 && !loading && supplierId && (
        <Card className="p-6 text-center text-muted-foreground text-sm">No outstanding bills for this supplier.</Card>
      )}
    </div>
  )
}
