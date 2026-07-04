import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const bills = await prisma.bill.findMany({
      include: { supplier: true, po: { select: { poNo: true } }, grn: { select: { grnNo: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ bills })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
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

    const count = await prisma.bill.count()
    const billNo = `BILL-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const bill = await prisma.bill.create({
      data: {
        billNo,
        poId: body.poId || null,
        grnId: body.grnId || null,
        supplierId: body.supplierId,
        date: new Date(body.date),
        dueDate: new Date(body.dueDate),
        amount: body.amount || 0,
        paid: body.paid || 0,
        status: body.status || 'due',
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
    return NextResponse.json({ bill })
  } catch {
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}