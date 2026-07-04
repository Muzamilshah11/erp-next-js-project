'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default function BudgetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [budget, setBudget] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState<{ accountId: string; amount: number }[]>([])
  const [fiscalYear, setFiscalYear] = useState('')
  const [period, setPeriod] = useState('monthly')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('draft')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/finance/budgets/${params.id}`).then(r => r.json()),
      fetch('/api/finance/accounts').then(r => r.json()),
    ]).then(([bData, aData]) => {
      const b = bData.budget
      setBudget(b)
      setAccounts(aData.accounts ?? [])
      setFiscalYear(b.fiscalYear)
      setPeriod(b.period)
      setDescription(b.description || '')
      setStatus(b.status)
      setLines(b.lines?.map((l: any) => ({ accountId: l.accountId, amount: l.amount, actual: l.actual || 0 })) || [])
      setLoading(false)
    })
  }, [params.id])

  const addLine = () => setLines([...lines, { accountId: '', amount: 0 }])
  const updateLine = (idx: number, field: string, value: any) => setLines(lines.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx))

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/finance/budgets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear, period, description, status, lines: lines.map(l => ({ accountId: l.accountId, amount: l.amount })) }),
      })
      setEditing(false)
      const res = await fetch(`/api/finance/budgets/${params.id}`)
      const data = await res.json()
      setBudget(data.budget)
      setLines(data.budget.lines?.map((l: any) => ({ accountId: l.accountId, amount: l.amount, actual: l.actual || 0 })) || [])
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this budget?')) return
    await fetch(`/api/finance/budgets/${params.id}`, { method: 'DELETE' })
    router.push('/finance/budgets')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!budget) return <div className="text-center text-muted-foreground py-12">Budget not found.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/budgets" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{budget.budgetNo}</h1>
            <Badge className={statusColors[status] || ''}>{status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDelete}>Delete</Button>
          <Button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save' : 'Edit'}
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Fiscal Year</Label>
            {editing ? (
              <Select value={fiscalYear} onValueChange={setFiscalYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                  <SelectItem value="2027-2028">2027-2028</SelectItem>
                </SelectContent>
              </Select>
            ) : <p className="text-sm font-medium pt-1">{budget.fiscalYear}</p>}
          </div>
          <div className="space-y-2">
            <Label>Period</Label>
            {editing ? (
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            ) : <p className="text-sm font-medium pt-1">{budget.period}</p>}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            {editing ? (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            ) : <p className="text-sm font-medium pt-1">{budget.status}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          {editing ? <Input value={description} onChange={e => setDescription(e.target.value)} /> : <p className="text-sm">{budget.description || '-'}</p>}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Budget Lines</h2>
          {editing && <Button variant="outline" size="sm" onClick={addLine}><Plus className="w-4 h-4 mr-2" />Add Line</Button>}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2">Account</th>
              <th className="pb-2 text-right">Budgeted</th>
              <th className="pb-2 text-right">Actual</th>
              <th className="pb-2 text-right">Variance</th>
              {editing && <th className="pb-2 text-right w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {(lines as any[]).map((line: any, idx: number) => {
              const actual = line.actual || 0
              const variance = (line.amount || 0) - actual
              return (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2">
                    {editing ? (
                      <Select value={line.accountId} onValueChange={(v) => updateLine(idx, 'accountId', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (accounts.find((a: any) => a.id === line.accountId)?.name || line.accountId)}
                  </td>
                  <td className="py-2 text-right">
                    {editing ? <Input type="number" className="w-28 ml-auto text-right" min={0} step="0.01" value={line.amount || ''} onChange={e => updateLine(idx, 'amount', Number(e.target.value))} /> : `$${(line.amount || 0).toLocaleString()}`}
                  </td>
                  <td className="py-2 text-right">${actual.toLocaleString()}</td>
                  <td className={`py-2 text-right font-medium ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {variance >= 0 ? '+' : ''}${variance.toLocaleString()}
                  </td>
                  {editing && (
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => removeLine(idx)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t">
              <td className="pt-2">Total</td>
              <td className="pt-2 text-right">${lines.reduce((s: number, l: any) => s + (l.amount || 0), 0).toLocaleString()}</td>
              <td className="pt-2 text-right">${lines.reduce((s: number, l: any) => s + (l.actual || 0), 0).toLocaleString()}</td>
              <td className="pt-2 text-right">${(lines.reduce((s: number, l: any) => s + (l.amount || 0), 0) - lines.reduce((s: number, l: any) => s + (l.actual || 0), 0)).toLocaleString()}</td>
              {editing && <td className="pt-2"></td>}
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  )
}
