import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const where = q ? { OR: [{ transferNo: { contains: q, mode: 'insensitive' as const } }] } : {}

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse: { select: { id: true, name: true } },
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ transfers })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.fromWarehouseId || !body.toWarehouseId || !body.date || !body.items?.length) {
      return NextResponse.json({ error: 'fromWarehouseId, toWarehouseId, date, and items are required' }, { status: 400 })
    }
    if (body.fromWarehouseId === body.toWarehouseId) {
      return NextResponse.json({ error: 'From and To warehouses must be different' }, { status: 400 })
    }

    const prefix = 'ST-'
    const count = await prisma.stockTransfer.count()
    const transferNo = `${prefix}${String(count + 1).padStart(4, '0')}`

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNo,
        fromWarehouseId: body.fromWarehouseId,
        toWarehouseId: body.toWarehouseId,
        date: new Date(body.date),
        status: body.status || 'draft',
        items: {
          create: body.items.map((item: { itemId: string; quantity: number }) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse: { select: { id: true, name: true } },
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
    })
    return NextResponse.json({ transfer })
  } catch {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}