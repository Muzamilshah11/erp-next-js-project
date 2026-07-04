import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const where: Record<string, unknown> = {}
    if (q) where.OR = [{ creditNoteNo: { contains: q, mode: 'insensitive' } }, { reason: { contains: q, mode: 'insensitive' } }]
    const creditNotes = await prisma.customerCreditNote.findMany({
      where,
      include: { customer: { select: { id: true, name: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ creditNotes })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch credit notes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const last = await prisma.customerCreditNote.findFirst({ orderBy: { createdAt: 'desc' } })
    const nextNum = last ? String(Number(last.creditNoteNo.replace('CN-', '')) + 1).padStart(4, '0') : '0001'
    const creditNoteNo = `CN-${nextNum}`
    const creditNote = await prisma.customerCreditNote.create({
      data: {
        creditNoteNo,
        customerId: body.customerId,
        date: new Date(body.date),
        amount: body.amount,
        reason: body.reason,
        status: body.status ?? 'draft',
        items: {
          create: (body.items ?? []).map((item: { itemId?: string; warehouseId?: string; description: string; quantity: number; price: number }) => ({
            itemId: item.itemId,
            warehouseId: item.warehouseId,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { customer: { select: { id: true, name: true } }, items: true },
    })
    return NextResponse.json({ creditNote })
  } catch {
    return NextResponse.json({ error: 'Failed to create credit note' }, { status: 500 })
  }
}
