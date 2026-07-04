'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPurchaseCreditNotePage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')
  const [items, setItems] = useState<{ description: string; quantity: number; price: number }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch('/api/purchases/suppliers').then(r => r.json()).then(d => setSuppliers(d.suppliers ?? [])) }, [])

  const total = items.reduce((s, it) => s + it.quantity * it.price, 0)

  const handleSave = async () => {
    if (!supplierId) return
    setSaving(true)
    try {
      const res = await fetch('/api/purchases/credit-notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplierId, date, reason, amount: total, items }) })
      const data = await res.json()
      if (data.creditNote) router.push(`/purchases/credit-notes/${data.creditNote.id}`)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/purchases/credit-notes" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-semibold">New Supplier Credit Note</h1></div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Reason</Label>
          <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for credit note" />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Items</h2>
          <Button variant="outline" size="sm" onClick={() => setItems([...items, { description: '', quantity: 1, price: 0 }])}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
        </div>
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-10 gap-2 items-end border-b pb-3">
            <div className="col-span-4 space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={it.description} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
            </div>
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">Qty</Label>
              <Input type="number" min={1} value={it.quantity} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Price</Label>
              <Input type="number" min={0} step="0.01" value={it.price} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) } : x))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Total</Label>
              <p className="text-sm font-medium pt-1">${(it.quantity * it.price).toFixed(2)}</p>
            </div>
            <div className="col-span-1"><Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-500" /></Button></div>
          </div>
        ))}
        {items.length > 0 && <div className="flex justify-end pt-2"><p className="text-lg font-semibold">Total: ${total.toFixed(2)}</p></div>}
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/purchases/credit-notes')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !supplierId}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
  )
}
