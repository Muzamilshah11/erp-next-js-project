import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'trial-balance'
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')

  try {
    const accounts = await prisma.account.findMany({ orderBy: { code: 'asc' } })

    const dateFilter = fromDate && toDate
      ? { journalEntry: { date: { gte: new Date(fromDate), lte: new Date(toDate) } } }
      : {}

    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: { in: accounts.map(a => a.id) },
        ...(fromDate && toDate ? { journalEntry: { date: { gte: new Date(fromDate), lte: new Date(toDate) } } } : {}),
      },
      include: { journalEntry: { select: { date: true } } },
    })

    const linesByAccount: Record<string, { debit: number; credit: number }> = {}
    for (const line of lines) {
      if (!linesByAccount[line.accountId]) linesByAccount[line.accountId] = { debit: 0, credit: 0 }
      linesByAccount[line.accountId].debit += line.debit
      linesByAccount[line.accountId].credit += line.credit
    }

    // ── Balance Sheet ──
    if (type === 'balance-sheet') {
      const assets: { code: string; name: string; balance: number }[] = []
      const liabilities: { code: string; name: string; balance: number }[] = []
      const equity: { code: string; name: string; balance: number }[] = []

      for (const acc of accounts) {
        const l = linesByAccount[acc.id] || { debit: 0, credit: 0 }
        const netChange = l.debit - l.credit
        const balance = acc.balance + netChange

        if (acc.type === 'Asset') assets.push({ code: acc.code, name: acc.name, balance })
        else if (acc.type === 'Liability') liabilities.push({ code: acc.code, name: acc.name, balance })
        else if (acc.type === 'Equity') equity.push({ code: acc.code, name: acc.name, balance })
      }

      const totalAssets = assets.reduce((s, a) => s + Math.abs(a.balance), 0)
      const totalLiabilities = liabilities.reduce((s, l) => s + Math.abs(l.balance), 0)
      const totalEquity = equity.reduce((s, e) => s + Math.abs(e.balance), 0)

      return NextResponse.json({
        type: 'balance-sheet',
        date: toDate || new Date().toISOString(),
        sections: {
          assets: { items: assets, total: totalAssets },
          liabilities: { items: liabilities, total: totalLiabilities },
          equity: { items: equity, total: totalEquity },
        },
        totalLiabilitiesEquity: totalLiabilities + totalEquity,
      })
    }

    // ── Income Statement ──
    if (type === 'income-statement') {
      const revenue: { code: string; name: string; amount: number }[] = []
      const expenses: { code: string; name: string; amount: number }[] = []

      for (const acc of accounts) {
        const l = linesByAccount[acc.id] || { debit: 0, credit: 0 }
        const netAmount = Math.abs(l.credit - l.debit)

        if (acc.type === 'Revenue') revenue.push({ code: acc.code, name: acc.name, amount: l.credit - l.debit })
        else if (acc.type === 'Expense') expenses.push({ code: acc.code, name: acc.name, amount: l.debit - l.credit })
      }

      const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0)
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
      const netIncome = totalRevenue - totalExpenses

      return NextResponse.json({
        type: 'income-statement',
        from: fromDate,
        to: toDate,
        sections: {
          revenue: { items: revenue, total: totalRevenue },
          expenses: { items: expenses, total: totalExpenses },
        },
        netIncome,
      })
    }

    // ── Trial Balance (default) ──
    const rows = accounts.map(acc => {
      const l = linesByAccount[acc.id] || { debit: 0, credit: 0 }
      const netChange = l.debit - l.credit
      const balance = acc.balance + netChange
      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: l.debit,
        credit: l.credit,
        balance,
      }
    })

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0)
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0)

    return NextResponse.json({
      type: 'trial-balance',
      date: toDate || new Date().toISOString(),
      rows,
      totals: { debit: totalDebit, credit: totalCredit },
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
