import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type'); const status = searchParams.get('status'); const itemId = searchParams.get('itemId')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (status) where.status = status
    if (itemId) where.itemId = itemId

    const orders = await prisma.workOrder.findMany({
      where,
      include: {
        item: { select: { id: true, name: true, sku: true } },
        bom: { select: { id: true, bomNo: true, name: true } },
        workCenter: { select: { id: true, name: true } },
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.type || !body.itemId || !body.quantity) {
      return NextResponse.json({ error: 'type, itemId, and quantity are required' }, { status: 400 })
    }

    const prefix = body.type === 'assemble' ? 'MO-' : 'MU-'
    const count = await prisma.workOrder.count()
    const workOrderNo = `${prefix}${String(count + 1).padStart(4, '0')}`

    let orderItems: { itemId: string; quantity: number; type: string }[] = []

    if (body.type === 'assemble' && body.bomId) {
      const bom = await prisma.bOM.findUnique({ where: { id: body.bomId }, include: { items: true } })
      if (bom) {
        orderItems = bom.items.map(i => ({ itemId: i.itemId, quantity: i.quantity * body.quantity, type: 'component' }))
        orderItems.push({ itemId: body.itemId, quantity: body.quantity, type: 'finished-good' })
      }
    } else {
      orderItems = [{ itemId: body.itemId, quantity: body.quantity, type: 'finished-good' }]
    }

    const order = await prisma.workOrder.create({
      data: {
        workOrderNo, type: body.type, itemId: body.itemId, bomId: body.bomId || null,
        workCenterId: body.workCenterId || null, sourceWarehouseId: body.sourceWarehouseId || null,
        destinationWarehouseId: body.destinationWarehouseId || null, quantity: body.quantity || 1,
        status: 'draft', items: { create: orderItems },
      },
      include: {
        item: { select: { id: true, name: true, sku: true } },
        bom: { select: { id: true, bomNo: true, name: true } },
        workCenter: { select: { id: true, name: true } },
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
    })
    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 })
  }
}