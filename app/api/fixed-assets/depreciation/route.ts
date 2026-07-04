import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const depreciationEntries = await prisma.depreciationEntry.findMany({
      include: { asset: { select: { id: true, name: true, assetNo: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ depreciationEntries })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch depreciation entries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.assetId || !body.period || !body.amount) {
      return NextResponse.json({ error: 'assetId, period, and amount are required' }, { status: 400 })
    }

    // Check for existing entry for this asset/period
    const existing = await prisma.depreciationEntry.findFirst({ where: { assetId: body.assetId, period: body.period } })
    if (existing) return NextResponse.json({ error: 'Depreciation already posted for this period' }, { status: 400 })

    let journalEntryId: string | null = null
    const amount = parseFloat(body.amount)

    // Create GL entry
    const deprExpenseAccount = await prisma.account.findFirst({ where: { code: '6000' } })
    const deprAccount = await prisma.account.findFirst({ where: { code: '1501' } })

    if (deprExpenseAccount && deprAccount) {
      const jeCount = await prisma.journalEntry.count()
      const entryNo = `JE-${new Date().getFullYear()}-${String(jeCount + 1).padStart(6, '0')}`
      const je = await prisma.journalEntry.create({
        data: {
          entryNo, date: new Date(), description: `Depreciation ${body.period} - Asset`,
          totalDebit: amount, totalCredit: amount, status: 'posted',
          lines: { create: [{ accountId: deprExpenseAccount.id, debit: amount, credit: 0 }, { accountId: deprAccount.id, debit: 0, credit: amount }] },
        },
      })
      journalEntryId = je.id
    }

    const entry = await prisma.depreciationEntry.create({
      data: { assetId: body.assetId, period: body.period, amount, journalEntryId },
      include: { asset: { select: { name: true, assetNo: true } } },
    })

    // Update asset accumulated depreciation and net book value
    await prisma.asset.update({
      where: { id: body.assetId },
      data: { accumulatedDepr: { increment: amount }, netBookValue: { decrement: amount }, currentValue: { decrement: amount } },
    })

    return NextResponse.json({ depreciationEntry: entry })
  } catch {
    return NextResponse.json({ error: 'Failed to post depreciation' }, { status: 500 })
  }
}