import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const where = q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { item: { name: { contains: q, mode: 'insensitive' } } }] } : {}
    const boms = await prisma.bOM.findMany({
      where,
      include: { item: { select: { id: true, name: true, sku: true } }, items: { include: { item: { select: { id: true, name: true, sku: true, unitPrice: true } } } }, _count: { select: { items: true, workOrders: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ boms })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch BOMs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.itemId || !body.items?.length) {
      return NextResponse.json({ error: 'itemId and items are required' }, { status: 400 })
    }

    const prefix = 'BOM-'; const count = await prisma.bOM.count(); const bomNo = `${prefix}${String(count + 1).padStart(4, '0')}`

    // Calculate total cost from components
    let totalCost = 0
    const itemsData = []
    for (const item of body.items) {
      const invItem = await prisma.inventoryItem.findUnique({ where: { id: item.itemId } })
      const unitCost = item.unitCost ?? invItem?.unitPrice ?? 0
      const lineCost = unitCost * (item.quantity || 0) * (body.quantity || 1)
      totalCost += lineCost
      itemsData.push({ itemId: item.itemId, quantity: item.quantity || 1, unitCost })
    }

    const bom = await prisma.bOM.create({
      data: { bomNo, name: body.name || '', itemId: body.itemId, quantity: body.quantity || 1, totalCost, items: { create: itemsData } },
      include: { item: { select: { id: true, name: true, sku: true } }, items: { include: { item: { select: { id: true, name: true, sku: true, unitPrice: true } } } } },
    })
    return NextResponse.json({ bom })
  } catch {
    return NextResponse.json({ error: 'Failed to create BOM' }, { status: 500 })
  }
}