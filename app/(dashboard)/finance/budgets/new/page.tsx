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
import { formatCurrency } from '@/lib/utils'

export default function NewBudgetPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<any[]>([])
  const [fiscalYear, setFiscalYear] = useState('')
  const [period, setPeriod] = useState('monthly')
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<{ accountId: string; amount: number }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch('/api/finance/accounts').then(r => r.json()).then(d => setAccounts(d.accounts ?? [])) }, [])

  const addLine = () => setLines([...lines, { accountId: '', amount: 0 }])

  const updateLine = (idx: number, field: string, value: any) => {
    setLines(lines.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx))

  const totalBudget = lines.reduce((s, l) => s + (l.amount || 0), 0)

  const handleSave = async () => {
    if (!fiscalYear) return
    setSaving(true)
    try {
      const res = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear, period, description, lines }),
      })
      const data = await res.json()
      if (data.budget) router.push(`/finance/budgets/${data.budget.id}`)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/finance/budgets" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-semibold">New Budget</h1></div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Fiscal Year</Label>
            <Select value={fiscalYear} onValueChange={(v) => v && setFiscalYear(v)}>
              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
                <SelectItem value="2026-2027">2026-2027</SelectItem>
                <SelectItem value="2027-2028">2027-2028</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Budget description" />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Budget Lines</h2>
          <Button variant="outline" size="sm" onClick={addLine}><Plus className="w-4 h-4 mr-2" />Add Line</Button>
        </div>
        {lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-end border-b pb-3">
            <div className="col-span-7 space-y-1">
              <Label className="text-xs">Account</Label>
              <Select value={line.accountId} onValueChange={(v) => updateLine(idx, 'accountId', v)}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Budgeted Amount</Label>
              <Input type="number" min={0} step="0.01" value={line.amount || ''} onChange={e => updateLine(idx, 'amount', Number(e.target.value))} />
            </div>
            <div className="col-span-2 flex items-end">
              <Button variant="ghost" size="sm" onClick={() => removeLine(idx)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          </div>
        ))}
        {lines.length > 0 && (
          <div className="flex justify-end pt-2">
            <p className="text-lg font-semibold">Total Budget: {formatCurrency(totalBudget)}</p>
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/finance/budgets')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !fiscalYear || lines.length === 0}>{saving ? 'Saving...' : 'Save Budget'}</Button>
      </div>
    </div>
  )
}
