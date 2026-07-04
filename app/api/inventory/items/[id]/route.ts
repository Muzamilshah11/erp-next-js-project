import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const item = await prisma.inventoryItem.findUnique({ where: { id }, include: { warehouse: { select: { id: true, name: true } } } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const quantity = body.quantity !== undefined ? body.quantity : undefined
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: body.name,
        sku: body.sku,
        category: body.category,
        quantity: body.quantity,
        reorderLevel: body.reorderLevel,
        unitPrice: body.unitPrice,
        warehouseId: body.warehouseId ?? undefined,
        status: quantity !== undefined
          ? (quantity === 0 ? 'out-of-stock' : quantity < (body.reorderLevel || 0) ? 'low-stock' : 'in-stock')
          : undefined,
      },
    })
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.inventoryItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
