import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const budget = await prisma.budget.findUnique({ where: { id }, include: { lines: { include: { account: true } } } })
    if (!budget) return NextResponse.json({ error: 'Budget not found' }, { status: 404 })

    const fiscalYear = budget.fiscalYear
    const [startYear] = fiscalYear.split('-').map(Number)
    const startDate = new Date(startYear, 0, 1)
    const endDate = new Date(startYear + 1, 11, 31)

    const accountIds = budget.lines.map(l => l.accountId)
    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: { in: accountIds },
        journalEntry: {
          date: { gte: startDate, lte: endDate },
          status: 'posted',
        },
      },
    })

    const actualMap: Record<string, number> = {}
    for (const line of lines) {
      actualMap[line.accountId] = (actualMap[line.accountId] || 0) + (line.debit || 0) - (line.credit || 0)
    }

    const linesWithActuals = budget.lines.map(l => ({
      ...l,
      actual: Math.abs(actualMap[l.accountId] || 0),
    }))

    return NextResponse.json({ budget: { ...budget, lines: linesWithActuals } })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.fiscalYear) data.fiscalYear = body.fiscalYear
    if (body.period) data.period = body.period
    if (body.description !== undefined) data.description = body.description
    if (body.status) data.status = body.status
    const budget = await prisma.budget.update({
      where: { id },
      data: {
        ...data,
        lines: body.lines ? { deleteMany: {}, create: body.lines.map((line: { accountId: string; amount: number }) => ({ accountId: line.accountId, amount: line.amount || 0 })) } : undefined,
      },
      include: { lines: { include: { account: true } } },
    })
    return NextResponse.json({ budget })
  } catch {
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.budget.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}
