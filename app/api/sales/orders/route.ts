import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const orders = await prisma.salesOrder.findMany({
      include: { customer: true, quotation: true, items: true },
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
    if (!body.customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 })
    }

    const count = await prisma.salesOrder.count()
    const orderNo = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const order = await prisma.salesOrder.create({
      data: {
        orderNo,
        quotationId: body.quotationId || null,
        customerId: body.customerId,
        date: new Date(body.date),
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
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
      include: { customer: true, items: true },
    })
    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}