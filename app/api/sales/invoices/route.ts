import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = await prisma.invoice.findMany({
    include: { customer: true, items: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ invoices })
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const count = await prisma.invoice.count()
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        customerId: body.customerId,
        date: new Date(body.date),
        dueDate: new Date(body.dueDate),
        amount: body.amount,
        paid: body.paid || 0,
        status: body.status || 'draft',
        items: {
          create: body.items?.map((item: { description: string; quantity: number; price: number }) => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })) || [],
        },
      },
      include: { customer: true, items: true },
    })
    return NextResponse.json({ invoice })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
