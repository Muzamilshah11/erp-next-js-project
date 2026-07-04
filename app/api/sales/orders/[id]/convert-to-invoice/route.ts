import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'confirmed') {
      return NextResponse.json({ error: 'Only confirmed orders can be converted to invoices' }, { status: 400 })
    }

    const count = await prisma.invoice.count()
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        orderId: order.id,
        customerId: order.customerId,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: order.amount,
        status: 'draft',
        items: {
          create: order.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { customer: true, items: true },
    })

    await prisma.salesOrder.update({ where: { id }, data: { status: 'invoiced' } })

    return NextResponse.json({ invoice })
  } catch {
    return NextResponse.json({ error: 'Failed to convert order to invoice' }, { status: 500 })
  }
}