import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const deliveryNotes = await prisma.deliveryNote.findMany({
      include: { customer: true, invoice: true, order: true, items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ deliveryNotes })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch delivery notes' }, { status: 500 })
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

    const count = await prisma.deliveryNote.count()
    const dnNo = `DN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const deliveryNote = await prisma.deliveryNote.create({
      data: {
        dnNo,
        invoiceId: body.invoiceId || null,
        orderId: body.orderId || null,
        customerId: body.customerId,
        date: new Date(body.date),
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
    return NextResponse.json({ deliveryNote })
  } catch {
    return NextResponse.json({ error: 'Failed to create delivery note' }, { status: 500 })
  }
}