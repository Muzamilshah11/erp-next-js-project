import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    if (quotation.status !== 'accepted') {
      return NextResponse.json({ error: 'Only accepted quotations can be converted to orders' }, { status: 400 })
    }

    const count = await prisma.salesOrder.count()
    const orderNo = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const order = await prisma.salesOrder.create({
      data: {
        orderNo,
        quotationId: quotation.id,
        customerId: quotation.customerId,
        date: new Date(),
        amount: quotation.amount,
        status: 'confirmed',
        items: {
          create: quotation.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { customer: true, items: true },
    })

    await prisma.quotation.update({ where: { id }, data: { status: 'converted' } })

    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: 'Failed to convert quotation to order' }, { status: 500 })
  }
}