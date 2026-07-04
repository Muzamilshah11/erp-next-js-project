import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const budgets = await prisma.budget.findMany({
      include: { lines: { include: { account: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ budgets })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const count = await prisma.budget.count()
    const budgetNo = `BGT-${String(count + 1).padStart(4, '0')}`
    const budget = await prisma.budget.create({
      data: {
        budgetNo,
        fiscalYear: body.fiscalYear,
        period: body.period || 'monthly',
        description: body.description || null,
        status: body.status || 'draft',
        lines: {
          create: (body.lines ?? []).map((line: { accountId: string; amount: number }) => ({
            accountId: line.accountId,
            amount: line.amount || 0,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    })
    return NextResponse.json({ budget })
  } catch {
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}
