import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const type = searchParams.get('type') // 'where-used' | 'work-order'
    if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 })

    if (type === 'where-used') {
      const bomItems = await prisma.bOMItem.findMany({
        where: { itemId },
        include: { bom: { include: { item: { select: { id: true, name: true, sku: true } }, _count: { select: { items: true } } } } },
      })
      return NextResponse.json({ results: bomItems.map(b => ({ bom: b.bom, quantity: b.quantity })) })
    }

    const orders = await prisma.workOrder.findMany({
      where: { itemId },
      include: { item: { select: { id: true, name: true, sku: true } }, workCenter: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ results: orders })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch inquiry results' }, { status: 500 })
  }
}