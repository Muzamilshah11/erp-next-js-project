'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPurchasePaymentPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch('/api/purchases/suppliers').then(r => r.json()).then(d => setSuppliers(d.suppliers ?? [])) }, [])

  const handleSave = async () => {
    if (!supplierId || !amount) return
    setSaving(true)
    try {
      const res = await fetch('/api/purchases/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplierId, date, amount: Number(amount), paymentMethod, reference }) })
      const data = await res.json()
      if (data.payment) router.push(`/purchases/payments/${data.payment.id}`)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href="/purchases/payments" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-semibold">New Payment</h1></div>
      </div>
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Reference</Label><Input value={reference} onChange={e => setReference(e.target.value)} /></div>
        </div>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !supplierId || !amount}>{saving ? 'Saving...' : 'Save Payment'}</Button>
      </div>
    </div>
  )
}
