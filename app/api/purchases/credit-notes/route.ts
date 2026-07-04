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
    const creditNotes = await prisma.supplierCreditNote.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } }, items: true },
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
    const last = await prisma.supplierCreditNote.findFirst({ orderBy: { createdAt: 'desc' } })
    const nextNum = last ? String(Number(last.creditNoteNo.replace('SCN-', '')) + 1).padStart(4, '0') : '0001'
    const creditNoteNo = `SCN-${nextNum}`
    const creditNote = await prisma.supplierCreditNote.create({
      data: {
        creditNoteNo,
        supplierId: body.supplierId,
        date: new Date(body.date),
        amount: body.amount,
        reason: body.reason,
        status: body.status ?? 'draft',
        items: {
          create: (body.items ?? []).map((item: { description: string; quantity: number; price: number }) => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { supplier: { select: { id: true, name: true } }, items: true },
    })
    return NextResponse.json({ creditNote })
  } catch {
    return NextResponse.json({ error: 'Failed to create credit note' }, { status: 500 })
  }
}
