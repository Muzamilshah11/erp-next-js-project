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

interface Customer { id: string; name: string }
interface InventoryItem { id: string; sku: string; name: string }
interface Warehouse { id: string; name: string }

export default function NewSalesCreditNotePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [customerId, setCustomerId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')
  const [noteItems, setNoteItems] = useState<{ itemId: string; warehouseId: string; description: string; quantity: number; price: number }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/sales/customers').then(r => r.json()).then(d => setCustomers(d.customers ?? []))
    fetch('/api/inventory/items').then(r => r.json()).then(d => setItems(d.items ?? []))
    fetch('/api/inventory/warehouses').then(r => r.json()).then(d => setWarehouses(d.warehouses ?? []))
  }, [])

  const addItem = () => {
    setNoteItems([...noteItems, { itemId: '', warehouseId: '', description: '', quantity: 1, price: 0 }])
  }

  const updateItem = (idx: number, field: string, value: string | number) => {
    setNoteItems(noteItems.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  const removeItem = (idx: number) => {
    setNoteItems(noteItems.filter((_, i) => i !== idx))
  }

  const totalAmount = noteItems.reduce((sum, it) => sum + it.quantity * it.price, 0)

  const handleSave = async () => {
    if (!customerId) return
    setSaving(true)
    try {
      const res = await fetch('/api/sales/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, date, reason, amount: totalAmount, items: noteItems }),
      })
      const data = await res.json()
      if (data.creditNote) router.push(`/sales/credit-notes/${data.creditNote.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/sales/credit-notes" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">New Credit Note</h1>
          <p className="text-sm text-muted-foreground mt-1">Create a customer credit note</p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
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
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
        </div>
        {noteItems.length === 0 && <p className="text-sm text-muted-foreground">No items added yet.</p>}
        {noteItems.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-end border-b pb-3">
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Item</Label>
              <Select value={it.itemId} onValueChange={(v) => updateItem(idx, 'itemId', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.sku})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Warehouse</Label>
              <Select value={it.warehouseId} onValueChange={(v) => updateItem(idx, 'warehouseId', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={it.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
            </div>
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">Qty</Label>
              <Input type="number" min={1} value={it.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Price</Label>
              <Input type="number" min={0} step="0.01" value={it.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))} />
            </div>
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">Total</Label>
              <p className="text-sm font-medium pt-1">${(it.quantity * it.price).toFixed(2)}</p>
            </div>
            <div className="col-span-1 flex items-end">
              <Button variant="ghost" size="sm" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          </div>
        ))}
        {noteItems.length > 0 && (
          <div className="flex justify-end pt-2">
            <p className="text-lg font-semibold">Total: ${totalAmount.toFixed(2)}</p>
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/sales/credit-notes')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !customerId}>
          {saving ? 'Saving...' : 'Save Credit Note'}
        </Button>
      </div>
    </div>
  )
}
