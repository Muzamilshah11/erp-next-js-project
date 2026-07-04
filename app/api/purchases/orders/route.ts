import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { supplier: true, items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body.supplierId) {
      return NextResponse.json({ error: 'Supplier is required' }, { status: 400 })
    }

    const count = await prisma.purchaseOrder.count()
    const poNo = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const order = await prisma.purchaseOrder.create({
      data: {
        poNo,
        supplierId: body.supplierId,
        date: new Date(body.date),
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
        amount: body.amount || 0,
        status: body.status || 'draft',
        items: {
          create: (body.items || []).map((item: { description: string; quantity: number; price: number }) => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { supplier: true, items: true },
    })
    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
}