'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { VoucherForm } from '@/components/finance/voucher-form'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const voucherTypes = [
  { value: 'bank-payment', label: 'Bank Payment Voucher (Cheque)', icon: '🏦' },
  { value: 'bank-deposit', label: 'Bank Deposit Voucher (Receipt)', icon: '📥' },
  { value: 'cash-payment', label: 'Cash Payment Voucher (Petty Cash)', icon: '💵' },
  { value: 'cash-receipt', label: 'Cash Receipt Voucher', icon: '📤' },
  { value: 'bank-transfer', label: 'Bank Account Transfer', icon: '🔄' },
  { value: 'bulk', label: 'Bulk Vouchers', icon: '📋' },
  { value: 'journal', label: 'Journal Entry', icon: '📓' },
]

export default function NewVoucherPage() {
  const router = useRouter()
  const [type, setType] = useState<string>('')
  const [started, setStarted] = useState(false)

  if (started && type) {
    if (type === 'bulk') {
      return <BulkVoucherForm onBack={() => setStarted(false)} />
    }
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <button onClick={() => setStarted(false)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold">New {voucherTypes.find(v => v.value === type)?.label}</h1>
          </div>
        </div>
        <VoucherForm type={type} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/finance/vouchers" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">New Voucher</h1>
          <p className="text-sm text-muted-foreground mt-1">Select voucher type to continue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {voucherTypes.map((vt) => (
          <motion.div
            key={vt.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`p-4 cursor-pointer transition-colors hover:border-primary ${type === vt.value ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => { setType(vt.value); setStarted(true) }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{vt.icon}</span>
                <div>
                  <p className="font-medium text-sm">{vt.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function BulkVoucherForm({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<any[]>([])
  const [entries, setEntries] = useState<{ id: string; date: string; description: string; lines: { accountId: string; debit: number; credit: number }[] }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch('/api/finance/accounts').then(r => r.json()).then(d => setAccounts(d.accounts ?? [])) }, [])

  const addEntry = () => {
    setEntries([...entries, { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], description: '', lines: [{ accountId: '', debit: 0, credit: 0 }] }])
  }

  const updateEntry = (idx: number, field: string, value: any) => {
    setEntries(entries.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  const addLine = (entryIdx: number) => {
    setEntries(entries.map((e, i) => i === entryIdx ? { ...e, lines: [...e.lines, { accountId: '', debit: 0, credit: 0 }] } : e))
  }

  const updateLine = (entryIdx: number, lineIdx: number, field: string, value: any) => {
    setEntries(entries.map((e, i) => i === entryIdx ? { ...e, lines: e.lines.map((l, j) => j === lineIdx ? { ...l, [field]: value } : l) } : e))
  }

  const removeLine = (entryIdx: number, lineIdx: number) => {
    setEntries(entries.map((e, i) => i === entryIdx ? { ...e, lines: e.lines.filter((_, j) => j !== lineIdx) } : e))
  }

  const removeEntry = (idx: number) => {
    setEntries(entries.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const e of entries) {
        const totalDebit = e.lines.reduce((s, l) => s + (l.debit || 0), 0)
        const totalCredit = e.lines.reduce((s, l) => s + (l.credit || 0), 0)
        await fetch('/api/finance/vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'bulk',
            date: e.date,
            description: e.description,
            totalDebit,
            totalCredit,
            lines: e.lines.map(l => ({ accountId: l.accountId, debit: l.debit || 0, credit: l.credit || 0 })),
          }),
        })
      }
      router.push('/finance/vouchers')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Bulk Vouchers</h1>
          <p className="text-sm text-muted-foreground mt-1">Create multiple voucher entries at once</p>
        </div>
        <Button onClick={addEntry}><Plus className="w-4 h-4 mr-2" /> Add Entry</Button>
      </div>

      {entries.map((entry, idx) => (
        <Card key={entry.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Entry {idx + 1}</h3>
            <Button variant="ghost" size="sm" onClick={() => removeEntry(idx)} className="text-red-500">Remove</Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={entry.date} onChange={(e) => updateEntry(idx, 'date', e.target.value)} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Description</Label>
              <Input value={entry.description} onChange={(e) => updateEntry(idx, 'description', e.target.value)} placeholder="Entry description" />
            </div>
          </div>
          {entry.lines.map((line, lineIdx) => {
            const td = entry.lines.reduce((s, l) => s + (l.debit || 0), 0)
            const tc = entry.lines.reduce((s, l) => s + (l.credit || 0), 0)
            return (
              <div key={lineIdx} className="grid grid-cols-12 gap-2 items-end border-b pb-2">
                <div className="col-span-5 space-y-1">
                  <Label className="text-xs">Account</Label>
                  <Select value={line.accountId} onValueChange={(v) => updateLine(idx, lineIdx, 'accountId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Debit</Label>
                  <Input type="number" min={0} step="0.01" value={line.debit || ''} onChange={(e) => updateLine(idx, lineIdx, 'debit', Number(e.target.value))} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Credit</Label>
                  <Input type="number" min={0} step="0.01" value={line.credit || ''} onChange={(e) => updateLine(idx, lineIdx, 'credit', Number(e.target.value))} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Diff</Label>
                  <p className={`text-sm font-medium pt-1 ${td !== tc ? 'text-red-500' : 'text-green-600'}`}>
                    {(td - tc).toFixed(2)}
                  </p>
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="sm" onClick={() => removeLine(idx, lineIdx)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            )
          })}
          <Button variant="outline" size="sm" onClick={() => addLine(idx)}><Plus className="w-4 h-4 mr-2" /> Line</Button>
        </Card>
      ))}

      {entries.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No entries yet. Click "Add Entry" to start.</p>
        </Card>
      )}

      {entries.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : `Save ${entries.length} Entries`}</Button>
        </div>
      )}
    </div>
  )
}
