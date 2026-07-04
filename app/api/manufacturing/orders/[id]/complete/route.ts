import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()

    const order = await prisma.workOrder.findUnique({ where: { id }, include: { items: true } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (order.status !== 'in-progress') return NextResponse.json({ error: 'Order must be in-progress to complete' }, { status: 400 })

    const producedQty = body.producedQty || order.quantity
    const updates = []

    if (order.type === 'assemble') {
      for (const item of order.items) {
        const consumptionRatio = producedQty / order.quantity
        if (item.type === 'component') {
          updates.push(prisma.inventoryItem.update({ where: { id: item.itemId }, data: { quantity: { decrement: Math.round(item.quantity * consumptionRatio) } } }))
        } else {
          updates.push(prisma.inventoryItem.update({ where: { id: item.itemId }, data: { quantity: { increment: producedQty }, warehouseId: order.destinationWarehouseId ?? undefined } }))
        }
      }
    } else {
      for (const item of order.items) {
        const consumptionRatio = producedQty / order.quantity
        if (item.type === 'finished-good') {
          updates.push(prisma.inventoryItem.update({ where: { id: item.itemId }, data: { quantity: { decrement: producedQty } } }))
        } else {
          updates.push(prisma.inventoryItem.update({ where: { id: item.itemId }, data: { quantity: { increment: Math.round(item.quantity * consumptionRatio) } } }))
        }
      }
    }

    await prisma.$transaction([
      ...updates,
      prisma.workOrder.update({ where: { id }, data: { status: 'completed', producedQty, endDate: new Date() } }),
    ])

    const updated = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, name: true, sku: true } },
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
    })
    return NextResponse.json({ order: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to complete work order' }, { status: 500 })
  }
}