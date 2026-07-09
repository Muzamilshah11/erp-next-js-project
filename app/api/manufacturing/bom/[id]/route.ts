import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const bom = await prisma.bOM.findUnique({
      where: { id },
      include: { item: { select: { id: true, name: true, sku: true, unitPrice: true } }, items: { include: { item: { select: { id: true, name: true, sku: true, unitPrice: true } } } } },
    })
    if (!bom) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ bom })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch BOM' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    let totalCost = 0
    const itemsData: { itemId: string; quantity: number; unitCost: number }[] | undefined = body.items ? [] : undefined
    if (body.items) {
      for (const item of body.items) {
        const invItem = await prisma.inventoryItem.findUnique({ where: { id: item.itemId } })
        const unitCost = item.unitCost ?? invItem?.unitPrice ?? 0
        totalCost += unitCost * (item.quantity || 0) * (body.quantity || 1)
        itemsData!.push({ itemId: item.itemId, quantity: item.quantity || 1, unitCost })
      }
    }

    const bom = await prisma.bOM.update({
      where: { id },
      data: {
        name: body.name, itemId: body.itemId, quantity: body.quantity,
        totalCost: totalCost > 0 ? totalCost : undefined,
        items: itemsData ? { deleteMany: {}, create: itemsData } : undefined,
      },
      include: { item: { select: { id: true, name: true, sku: true } }, items: { include: { item: { select: { id: true, name: true, sku: true, unitPrice: true } } } } },
    })
    return NextResponse.json({ bom })
  } catch {
    return NextResponse.json({ error: 'Failed to update BOM' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const bom = await prisma.bOM.findUnique({ where: { id }, include: { _count: { select: { workOrders: true } } } })
    if ((bom?._count.workOrders ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete BOM with linked work orders' }, { status: 400 })
    await prisma.bOM.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete BOM' }, { status: 500 })
  }
}