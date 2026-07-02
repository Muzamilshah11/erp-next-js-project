import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.inventoryItem.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
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
        status,
      },
    })
    return NextResponse.json({ item })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
