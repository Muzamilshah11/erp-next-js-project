import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const grns = await prisma.gRN.findMany({
      include: { supplier: true, po: { select: { id: true, poNo: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ grns })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch GRNs' }, { status: 500 })
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

    const count = await prisma.gRN.count()
    const grnNo = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const grn = await prisma.gRN.create({
      data: {
        grnNo,
        poId: body.poId || null,
        supplierId: body.supplierId,
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
      include: { supplier: true, items: true },
    })

    // Update inventory: increase quantity for matching items
    if (body.status === 'received' || body.status === undefined) {
      for (const item of (body.items || [])) {
        const inv = await prisma.inventoryItem.findFirst({
          where: { name: { contains: item.description, mode: 'insensitive' } },
        })
        if (inv) {
          await prisma.inventoryItem.update({
            where: { id: inv.id },
            data: { quantity: inv.quantity + item.quantity },
          })
        }
      }
    }

    return NextResponse.json({ grn })
  } catch {
    return NextResponse.json({ error: 'Failed to create GRN' }, { status: 500 })
  }
}