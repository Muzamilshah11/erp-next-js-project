import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const period = body.period || new Date().toISOString().slice(0, 7)

    const assets = await prisma.asset.findMany({ where: { status: 'active' }, include: { class: true } })
    const results: { assetNo: string; name: string; amount: number; status: string }[] = []

    for (const asset of assets) {
      // Check if already depreciated this period
      const existing = await prisma.depreciationEntry.findFirst({ where: { assetId: asset.id, period } })
      if (existing) { results.push({ assetNo: asset.assetNo, name: asset.name, amount: 0, status: 'skipped' }); continue }

      const purchaseCost = asset.purchaseCost
      const salvageValue = asset.class.salvageValue
      const usefulLife = asset.class.usefulLife
      const depreciableBase = purchaseCost - salvageValue
      if (depreciableBase <= 0 || usefulLife <= 0) { results.push({ assetNo: asset.assetNo, name: asset.name, amount: 0, status: 'skipped' }); continue }
      const monthlyDepr = depreciableBase / (usefulLife * 12)

      // Create GL entry
      let journalEntryId: string | null = null
      const deprExpenseAccount = await prisma.account.findFirst({ where: { code: '6000' } })
      const deprAccount = await prisma.account.findFirst({ where: { code: '1501' } })

      if (deprExpenseAccount && deprAccount) {
        const jeCount = await prisma.journalEntry.count()
        const entryNo = `JE-${new Date().getFullYear()}-${String(jeCount + 1).padStart(6, '0')}`
        const je = await prisma.journalEntry.create({
          data: {
            entryNo, date: new Date(), description: `Depreciation ${period} - ${asset.name}`,
            totalDebit: monthlyDepr, totalCredit: monthlyDepr, status: 'posted',
            lines: { create: [{ accountId: deprExpenseAccount.id, debit: monthlyDepr, credit: 0 }, { accountId: deprAccount.id, debit: 0, credit: monthlyDepr }] },
          },
        })
        journalEntryId = je.id
      }

      await prisma.depreciationEntry.create({ data: { assetId: asset.id, period, amount: monthlyDepr, journalEntryId } })
      await prisma.asset.update({ where: { id: asset.id }, data: { accumulatedDepr: { increment: monthlyDepr }, netBookValue: { decrement: monthlyDepr }, currentValue: { decrement: monthlyDepr } } })

      results.push({ assetNo: asset.assetNo, name: asset.name, amount: monthlyDepr, status: 'posted' })
    }

    return NextResponse.json({ results, total: results.filter(r => r.status === 'posted').length })
  } catch {
    return NextResponse.json({ error: 'Failed to process depreciation' }, { status: 500 })
  }
}