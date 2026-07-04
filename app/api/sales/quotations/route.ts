import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const quotations = await prisma.quotation.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ quotations })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 })
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

    const count = await prisma.quotation.count()
    const quoteNo = `QTE-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const quotation = await prisma.quotation.create({
      data: {
        quoteNo,
        customerId: body.customerId,
        date: new Date(body.date),
        validUntil: new Date(body.validUntil),
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
    return NextResponse.json({ quotation })
  } catch {
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 })
  }
}