'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default function BudgetsPage() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/finance/budgets')
      .then(r => r.json())
      .then(d => setBudgets(d.budgets ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">Financial budgets and planning</p>
        </div>
        <Button onClick={() => router.push('/finance/budgets/new')}>
          <Plus className="w-4 h-4 mr-2" /> New Budget
        </Button>
      </div>

      <DataTable
        columns={[
          { header: 'Budget No', accessor: 'budgetNo' },
          { header: 'Fiscal Year', accessor: 'fiscalYear' },
          { header: 'Period', accessor: 'period' },
          { header: 'Description', accessor: (b: any) => b.description || '-' },
          { header: 'Lines', accessor: (b: any) => b.lines?.length || 0 },
          { header: 'Status', accessor: (b: any) => <Badge className={statusColors[b.status] || ''}>{b.status}</Badge> },
          { header: '', accessor: (b: any) => <Button variant="ghost" size="sm" onClick={() => router.push(`/finance/budgets/${b.id}`)}>View</Button> },
        ]}
        data={budgets}
        loading={loading}
        emptyMessage="No budgets found"
      />
    </div>
  )
}
