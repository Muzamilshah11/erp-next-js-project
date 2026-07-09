import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId'); const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (assetId) where.assetId = assetId
    if (type) where.type = type

    const transactions = await prisma.assetTransaction.findMany({
      where, include: { asset: { select: { id: true, name: true, assetNo: true } } },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ transactions })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.assetId || !body.type || !body.date) {
      return NextResponse.json({ error: 'assetId, type, and date are required' }, { status: 400 })
    }

    const asset = await prisma.asset.findUnique({ where: { id: body.assetId }, include: { class: true } })
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    let journalEntryId: string | null = null
    const amount = parseFloat(body.amount) || 0

    // Create GL entry based on transaction type
    if (['disposal', 'sale', 'adjustment'].includes(body.type)) {
      const assetAccount = await prisma.account.findFirst({ where: { code: '1500' } })
      const cashAccount = await prisma.account.findFirst({ where: { code: '1000' } })
      const deprAccount = await prisma.account.findFirst({ where: { code: '1501' } })
      const gainLossAccount = (await prisma.account.findFirst({ where: { code: '4000' } })) || assetAccount!

      if (assetAccount && cashAccount) {
        const jeCount = await prisma.journalEntry.count()
        const entryNo = `JE-${new Date().getFullYear()}-${String(jeCount + 1).padStart(6, '0')}`

        const lines: { accountId: string; debit: number; credit: number }[] = []

        if (body.type === 'disposal') {
          // Dr Accumulated Depreciation, Dr Loss (if any), Cr Asset Account
          if (deprAccount && asset.accumulatedDepr > 0) lines.push({ accountId: deprAccount.id, debit: asset.accumulatedDepr, credit: 0 })
          const loss = (asset.purchaseCost - asset.accumulatedDepr) - amount
          if (loss > 0) lines.push({ accountId: gainLossAccount.id, debit: loss, credit: 0 })
          lines.push({ accountId: assetAccount.id, debit: 0, credit: asset.purchaseCost })
        } else if (body.type === 'sale') {
          const nbv = asset.currentValue - asset.accumulatedDepr
          const gain = amount - nbv
          if (deprAccount && asset.accumulatedDepr > 0) lines.push({ accountId: deprAccount.id, debit: asset.accumulatedDepr, credit: 0 })
          lines.push({ accountId: cashAccount.id, debit: amount, credit: 0 })
          lines.push({ accountId: assetAccount.id, debit: 0, credit: asset.purchaseCost })
          if (gain > 0) lines.push({ accountId: gainLossAccount.id, debit: 0, credit: gain })
          if (gain < 0) lines.push({ accountId: gainLossAccount.id, debit: Math.abs(gain), credit: 0 })
        } else if (body.type === 'adjustment') {
          if (amount > 0) lines.push({ accountId: assetAccount.id, debit: amount, credit: 0 })
          else lines.push({ accountId: assetAccount.id, debit: 0, credit: Math.abs(amount) })
          lines.push({ accountId: cashAccount.id, debit: amount < 0 ? Math.abs(amount) : 0, credit: amount > 0 ? amount : 0 })
        }

        if (lines.length > 0) {
          const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
          const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
          const je = await prisma.journalEntry.create({
            data: { entryNo, date: new Date(body.date), description: `Asset ${body.type}: ${asset.name}`, totalDebit, totalCredit, status: 'posted', lines: { create: lines } },
          })
          journalEntryId = je.id
        }
      }
    }

    const transaction = await prisma.assetTransaction.create({
      data: {
        assetId: body.assetId, type: body.type, date: new Date(body.date),
        description: body.description || null, fromLocation: body.fromLocation || null,
        toLocation: body.toLocation || null, amount, journalEntryId,
      },
      include: { asset: { select: { name: true, assetNo: true } } },
    })

    // Update asset state based on transaction type
    if (body.type === 'disposal' || body.type === 'sale') {
      await prisma.asset.update({ where: { id: body.assetId }, data: { status: body.type === 'sale' ? 'sold' : 'disposed' } })
    }

    return NextResponse.json({ transaction })
  } catch {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}