'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Account { id: string; code: string; name: string; subType: string }

interface Line { accountId: string; debit: number; credit: number }

interface VoucherFormProps {
  type: string
  initialData?: any
  onSave?: (data: any) => void
  saveLabel?: string
}

export function VoucherForm({ type, initialData, onSave, saveLabel }: VoucherFormProps) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [date, setDate] = useState(initialData?.date?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState(initialData?.description || '')
  const [payee, setPayee] = useState(initialData?.payee || '')
  const [reference, setReference] = useState(initialData?.reference || '')
  const [chequeNo, setChequeNo] = useState(initialData?.chequeNo || '')
  const [chequeDate, setChequeDate] = useState(initialData?.chequeDate?.split('T')[0] || '')
  const [lines, setLines] = useState<Line[]>(initialData?.lines?.map((l: any) => ({ accountId: l.accountId || l.account?.id || '', debit: l.debit || 0, credit: l.credit || 0 })) || [{ accountId: '', debit: 0, credit: 0 }])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch('/api/finance/accounts').then(r => r.json()).then(d => setAccounts(d.accounts ?? [])) }, [])

  const filteredAccounts = (subType: string) => {
    if (subType === 'bank') return accounts.filter(a => a.subType === 'bank')
    if (subType === 'cash') return accounts.filter(a => a.subType === 'cash')
    return accounts
  }

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const updateLine = (idx: number, field: keyof Line, value: string | number) => {
    setLines(lines.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const addLine = () => {
    const emptyLine: Line = { accountId: '', debit: 0, credit: 0 }
    if (type === 'bank-transfer') {
      setLines([...lines, emptyLine])
    } else {
      setLines([...lines, emptyLine])
    }
  }

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return
    setLines(lines.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const body: any = {
        type,
        date,
        description,
        totalDebit,
        totalCredit,
        payee: payee || null,
        reference: reference || null,
        chequeNo: type === 'bank-payment' || type === 'bank-transfer' ? (chequeNo || null) : null,
        chequeDate: type === 'bank-payment' || type === 'bank-transfer' ? (chequeDate || null) : null,
        lines: lines.map(l => ({ accountId: l.accountId, debit: l.debit || 0, credit: l.credit || 0 })),
      }
      if (onSave) { onSave(body); return }
      const res = await fetch('/api/finance/vouchers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.entry) router.push(`/finance/vouchers/${data.entry.id}`)
    } finally { setSaving(false) }
  }

  const showChequeFields = type === 'bank-payment' || type === 'bank-transfer'
  const showPayeeField = type === 'bank-payment' || type === 'cash-payment'
  const showReferenceField = type === 'bank-deposit' || type === 'cash-receipt'

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {showPayeeField && (
            <div className="space-y-2">
              <Label>Payee</Label>
              <Input value={payee} onChange={e => setPayee(e.target.value)} placeholder="Payee name" />
            </div>
          )}
          {showReferenceField && (
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Reference no" />
            </div>
          )}
          {!showPayeeField && !showReferenceField && type !== 'bank-transfer' && (
            <div className="space-y-2">
              <Label>Payer / Source</Label>
              <Input value={payee} onChange={e => setPayee(e.target.value)} placeholder={type === 'cash-receipt' ? 'Payer name' : 'Description'} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Voucher description" />
        </div>

        {showChequeFields && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cheque No</Label>
              <Input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque number" />
            </div>
            <div className="space-y-2">
              <Label>Cheque Date</Label>
              <Input type="date" value={chequeDate} onChange={e => setChequeDate(e.target.value)} />
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Debit / Credit Lines</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {isBalanced ? '✓ Balanced' : `Diff: ${formatCurrency(totalDebit - totalCredit)}`}
            </span>
            <Button variant="outline" size="sm" onClick={addLine}><Plus className="w-4 h-4 mr-2" />Add Line</Button>
          </div>
        </div>

        <div className="space-y-3">
          {type === 'bank-transfer' && lines.length === 2 && (
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                <p className="text-xs text-muted-foreground mb-1">From Bank (Credit)</p>
                <Select value={lines[0]?.accountId || ''} onValueChange={(v) => v && updateLine(0, 'accountId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select source bank" /></SelectTrigger>
                  <SelectContent>
                    {filteredAccounts('bank').map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                <p className="text-xs text-muted-foreground mb-1">To Bank (Debit)</p>
                <Select value={lines[1]?.accountId || ''} onValueChange={(v) => v && updateLine(1, 'accountId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select target bank" /></SelectTrigger>
                  <SelectContent>
                    {filteredAccounts('bank').map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Amount</Label>
                <Input type="number" min={0} step="0.01" value={lines[0]?.credit || ''}
                  onChange={(e) => { const v = Number(e.target.value); setLines([{ ...lines[0], credit: v }, { ...lines[1], debit: v }]) }}
                />
              </div>
            </div>
          )}

          {type !== 'bank-transfer' && lines.map((line, idx) => {
            const isFirst = idx === 0
            const isAutoAccount = (type === 'bank-payment' && isFirst) || (type === 'bank-deposit' && isFirst) || (type === 'cash-payment' && isFirst) || (type === 'cash-receipt' && isFirst)
            const isAutoCredit = type === 'bank-payment' || type === 'cash-payment'
            const isAutoDebit = type === 'bank-deposit' || type === 'cash-receipt'
            const filterType = (type === 'bank-payment' || type === 'bank-deposit') ? 'bank' : (type === 'cash-payment' || type === 'cash-receipt') ? 'cash' : null

            return (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end border-b pb-3">
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">{isAutoAccount ? (isAutoCredit ? 'Bank/Cash (Credit)' : 'Bank/Cash (Debit)') : 'Account'}</Label>
                  <Select value={line.accountId} onValueChange={(v) => v && updateLine(idx, 'accountId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {(isAutoAccount && filterType ? filteredAccounts(filterType) : accounts).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.code} - {a.name} ({a.subType})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Debit</Label>
                  {isAutoAccount && isAutoCredit ? (
                    <div className="h-10 flex items-center text-sm text-muted-foreground">Auto (Credit)</div>
                  ) : (
                    <Input type="number" min={0} step="0.01" value={line.debit || ''} onChange={e => updateLine(idx, 'debit', Number(e.target.value))} />
                  )}
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Credit</Label>
                  {isAutoAccount && isAutoDebit ? (
                    <div className="h-10 flex items-center text-sm text-muted-foreground">Auto (Debit)</div>
                  ) : (
                    <Input type="number" min={0} step="0.01" value={line.credit || ''} onChange={e => updateLine(idx, 'credit', Number(e.target.value))} />
                  )}
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Balance</Label>
                  <p className="text-sm font-medium pt-1">{formatCurrency((line.debit || 0) - (line.credit || 0))}</p>
                </div>
                <div className="col-span-1 flex items-end">
                  {!isAutoAccount && <Button variant="ghost" size="sm" onClick={() => removeLine(idx)}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between pt-2 border-t">
          <div className="space-y-1 text-sm">
            <p>Total Debit: <span className="font-semibold">{formatCurrency(totalDebit)}</span></p>
            <p>Total Credit: <span className="font-semibold">{formatCurrency(totalCredit)}</span></p>
          </div>
          <Button onClick={handleSubmit} disabled={saving || !isBalanced || lines.length === 0}>
            {saving ? 'Saving...' : saveLabel || 'Save Voucher'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
