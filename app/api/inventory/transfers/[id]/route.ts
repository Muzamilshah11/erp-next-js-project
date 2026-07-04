import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse: { select: { id: true, name: true } },
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
    })
    if (!transfer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ transfer })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch transfer' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()

    if (body.status === 'completed') {
      const transfer = await prisma.stockTransfer.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!transfer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      for (const item of transfer.items) {
        await prisma.inventoryItem.update({
          where: { id: item.itemId },
          data: { quantity: { decrement: item.quantity }, warehouseId: null },
        })
        await prisma.inventoryItem.update({
          where: { id: item.itemId },
          data: { quantity: { increment: item.quantity }, warehouseId: transfer.toWarehouseId },
        })
      }
    }

    const transfer = await prisma.stockTransfer.update({
      where: { id },
      data: {
        fromWarehouseId: body.fromWarehouseId,
        toWarehouseId: body.toWarehouseId,
        date: body.date ? new Date(body.date) : undefined,
        status: body.status,
      },
      include: {
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse: { select: { id: true, name: true } },
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
    })
    return NextResponse.json({ transfer })
  } catch {
    return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const transfer = await prisma.stockTransfer.findUnique({ where: { id } })
    if (transfer?.status === 'completed') {
      return NextResponse.json({ error: 'Cannot delete a completed transfer' }, { status: 400 })
    }
    await prisma.stockTransfer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 })
  }
}