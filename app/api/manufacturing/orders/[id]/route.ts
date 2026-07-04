import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const order = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, name: true, sku: true } },
        bom: { select: { id: true, bomNo: true, name: true, items: { include: { item: { select: { id: true, name: true, sku: true } } } } } },
        workCenter: { select: { id: true, name: true } },
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch work order' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()

    if (body.status === 'completed') {
      const order = await prisma.workOrder.findUnique({ where: { id }, include: { items: true } })
      if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const updates = []
      if (order.type === 'assemble') {
        for (const item of order.items) {
          if (item.type === 'component') {
            updates.push(prisma.inventoryItem.update({ where: { id: item.itemId }, data: { quantity: { decrement: item.consumedQty || item.quantity } } }))
          } else {
            updates.push(prisma.inventoryItem.update({ where: { id: item.itemId }, data: { quantity: { increment: item.consumedQty || item.quantity }, warehouseId: order.destinationWarehouseId ?? undefined } }))
          }
        }
      } else {
        for (const item of order.items) {
          if (item.type === 'finished-good') {
            updates.push(prisma.inventoryItem.update({ where: { id: item.itemId }, data: { quantity: { decrement: item.consumedQty || item.quantity } } }))
          } else {
            updates.push(prisma.inventoryItem.update({ where: { id: item.itemId }, data: { quantity: { increment: item.consumedQty || item.quantity } } }))
          }
        }
      }
      await prisma.$transaction(updates)
    }

    if (body.status === 'in-progress') {
      body.startDate = new Date()
    }
    if (body.status === 'completed') {
      body.endDate = new Date()
    }

    const order = await prisma.workOrder.update({
      where: { id },
      data: {
        status: body.status, workCenterId: body.workCenterId, sourceWarehouseId: body.sourceWarehouseId,
        destinationWarehouseId: body.destinationWarehouseId, startDate: body.startDate, endDate: body.endDate,
        producedQty: body.producedQty,
        items: body.items ? { deleteMany: {}, create: body.items.map((i: { itemId: string; quantity: number; consumedQty: number; type: string }) => ({ itemId: i.itemId, quantity: i.quantity || 1, consumedQty: i.consumedQty || 0, type: i.type || 'component' })) } : undefined,
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
    return NextResponse.json({ error: 'Failed to update work order' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const order = await prisma.workOrder.findUnique({ where: { id } })
    if (order?.status !== 'draft') return NextResponse.json({ error: 'Cannot delete a non-draft work order' }, { status: 400 })
    await prisma.workOrder.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete work order' }, { status: 500 })
  }
}