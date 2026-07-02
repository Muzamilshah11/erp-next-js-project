import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  const where = accountId ? { accountId } : {}
  const reconciliations = await prisma.reconciliation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ reconciliations })
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    const bankTxns = await prisma.bankTransaction.findMany({ where: { accountId: body.accountId } })
    const statementBalance = bankTxns.reduce((sum, t) => sum + t.debit - t.credit, 0)

    const journalLines = await prisma.journalLine.findMany({
      where: { accountId: body.accountId },
      include: { journalEntry: { select: { date: true } } },
    })
    const ledgerBalance = journalLines.reduce((sum, l) => sum + l.debit - l.credit, 0)

    const account = await prisma.account.findUnique({ where: { id: body.accountId } })
    const openingBalance = account?.balance || 0

    const reconciliation = await prisma.reconciliation.create({
      data: {
        accountId: body.accountId,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        statementBalance,
        ledgerBalance,
        difference: Math.abs(statementBalance - ledgerBalance),
        status: statementBalance === ledgerBalance ? 'completed' : 'draft',
      },
    })
    return NextResponse.json({ reconciliation })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create reconciliation' }, { status: 500 })
  }
}
