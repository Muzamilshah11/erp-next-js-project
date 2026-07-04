import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'

    if (type === 'summary') {
      const [activeCount, disposedCount, totalValue, totalDepr] = await Promise.all([
        prisma.asset.count({ where: { status: 'active' } }),
        prisma.asset.count({ where: { status: { in: ['disposed', 'sold'] } } }),
        prisma.asset.aggregate({ _sum: { purchaseCost: true } }),
        prisma.asset.aggregate({ _sum: { accumulatedDepr: true } }),
      ])
      return NextResponse.json({ summary: { activeCount, disposedCount, totalPurchaseCost: totalValue._sum.purchaseCost || 0, totalDepreciation: totalDepr._sum.accumulatedDepr || 0 } })
    }

    if (type === 'depr-schedule') {
      const assets = await prisma.asset.findMany({ where: { status: 'active' }, include: { class: true, depreciationEntries: { orderBy: { createdAt: 'desc' }, take: 1 }, category: { select: { name: true } } } })
      const schedule = assets.map(a => ({ id: a.id, assetNo: a.assetNo, name: a.name, category: a.category.name, purchaseCost: a.purchaseCost, accumulatedDepr: a.accumulatedDepr, netBookValue: a.netBookValue, usefulLife: a.class.usefulLife, salvageValue: a.class.salvageValue, lastDepreciation: a.depreciationEntries[0]?.period || '-' }))
      return NextResponse.json({ schedule })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
  }
}