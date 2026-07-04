'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface OutstandingInvoice { id: string; invoiceNo: string; amount: number; paid: number }
interface Payment { id: string; paymentNo: string; amount: number; date: string }

export default function SalesAllocationsPage() {
  const [allocationType, setAllocationType] = useState<'payment' | 'creditNote'>('payment')
  const [customerId, setCustomerId] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPaymentId, setSelectedPaymentId] = useState('')
  const [creditNotes, setCreditNotes] = useState<any[]>([])
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState('')
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([])
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/sales/customers').then(r => r.json()).then(d => setCustomers(d.customers ?? [])) }, [])

  const loadData = async (custId: string) => {
    setLoading(true)
    const [pRes, cnRes, iRes] = await Promise.all([
      fetch(`/api/sales/payments?customerId=${custId}`),
      fetch(`/api/sales/credit-notes?customerId=${custId}`),
      fetch(`/api/sales/invoices?customerId=${custId}`),
    ])
    const pData = await pRes.json()
    const cnData = await cnRes.json()
    const iData = await iRes.json()
    setPayments(pData.payments ?? [])
    setCreditNotes(cnData.creditNotes ?? [])
    const invs: OutstandingInvoice[] = (iData.invoices ?? [])
      .filter((inv: any) => inv.status !== 'paid' && inv.amount > inv.paid)
      .map((inv: any) => ({ id: inv.id, invoiceNo: inv.invoiceNo, amount: inv.amount, paid: inv.paid }))
    setInvoices(invs)
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
      const invoiceAllocations = Object.entries(allocations)
        .filter(([_, amt]) => amt > 0)
        .map(([invoiceId, amount]) => ({ invoiceId, amount }))
      const body: any = allocationType === 'payment'
        ? { paymentId: selectedPaymentId, invoiceAllocations }
        : { creditNoteId: selectedCreditNoteId, invoiceAllocations }
      await fetch('/api/sales/allocations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setAllocations({})
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/sales" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-semibold">Allocations</h1><p className="text-sm text-muted-foreground mt-1">Allocate payments or credit notes to invoices</p></div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={(v) => { setCustomerId(v); loadData(v) }}>
            <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
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
            <Select value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
              <SelectTrigger><SelectValue placeholder="Select payment" /></SelectTrigger>
              <SelectContent>
                {payments.filter(p => p.status === 'completed').map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.paymentNo} - ${p.amount.toLocaleString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Select Credit Note</Label>
            <Select value={selectedCreditNoteId} onValueChange={setSelectedCreditNoteId}>
              <SelectTrigger><SelectValue placeholder="Select credit note" /></SelectTrigger>
              <SelectContent>
                {creditNotes.filter(cn => cn.status === 'issued').map(cn => (
                  <SelectItem key={cn.id} value={cn.id}>{cn.creditNoteNo} - ${cn.amount.toLocaleString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>

      {loading && <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}

      {invoices.length > 0 && (selectedPaymentId || selectedCreditNoteId) && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Outstanding Invoices</h2>
            <p className="text-sm text-muted-foreground">Remaining: ${remaining.toFixed(2)}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Invoice</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2 text-right">Paid</th>
                <th className="pb-2 text-right">Due</th>
                <th className="pb-2 text-right w-40">Allocate</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const due = inv.amount - inv.paid
                return (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-2">{inv.invoiceNo}</td>
                    <td className="py-2 text-right">${inv.amount.toLocaleString()}</td>
                    <td className="py-2 text-right">${inv.paid.toLocaleString()}</td>
                    <td className="py-2 text-right">${due.toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <Input
                        type="number"
                        min={0}
                        max={due}
                        step="0.01"
                        className="w-28 ml-auto text-right"
                        value={allocations[inv.id] || ''}
                        onChange={e => {
                          const val = Number(e.target.value)
                          setAllocations(prev => ({ ...prev, [inv.id]: val > due ? due : val }))
                        }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-muted-foreground">Total to allocate: ${totalAllocated.toFixed(2)}</p>
            <Button onClick={handleSave} disabled={saving || totalAllocated <= 0}>
              {saving ? 'Saving...' : 'Save Allocations'}
            </Button>
          </div>
        </Card>
      )}

      {invoices.length === 0 && !loading && customerId && (
        <Card className="p-6 text-center text-muted-foreground text-sm">No outstanding invoices for this customer.</Card>
      )}
    </div>
  )
}
