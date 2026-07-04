import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ],
    } : {}

    const items = await prisma.inventoryItem.findMany({
      where,
      include: { warehouse: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body.name || !body.sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 })
    }
    const quantity = body.quantity || 0
    const status = quantity === 0 ? 'out-of-stock' : quantity < (body.reorderLevel || 0) ? 'low-stock' : 'in-stock'

    const item = await prisma.inventoryItem.create({
      data: {
        sku: body.sku,
        name: body.name,
        category: body.category,
        quantity,
        reorderLevel: body.reorderLevel || 0,
        unitPrice: body.unitPrice || 0,
        warehouseId: body.warehouseId || null,
        status,
      },
    })
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
