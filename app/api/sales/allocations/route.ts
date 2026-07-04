import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')?.trim()
    const paymentId = searchParams.get('paymentId')?.trim()
    const creditNoteId = searchParams.get('creditNoteId')?.trim()
    const where: Record<string, unknown> = {}
    if (invoiceId) where.invoiceId = invoiceId
    if (paymentId) where.paymentId = paymentId
    if (creditNoteId) where.creditNoteId = creditNoteId
    const allocations = await prisma.customerAllocation.findMany({
      where,
      include: { invoice: { select: { id: true, invoiceNo: true, amount: true, paid: true } }, payment: { select: { id: true, paymentNo: true, amount: true } }, creditNote: { select: { id: true, creditNoteNo: true, amount: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ allocations })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch allocations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { paymentId, creditNoteId, invoiceAllocations } = body

    if (!paymentId && !creditNoteId) return NextResponse.json({ error: 'paymentId or creditNoteId required' }, { status: 400 })
    if (!invoiceAllocations?.length) return NextResponse.json({ error: 'invoiceAllocations required' }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      const created = []
      for (const alloc of invoiceAllocations) {
        if (alloc.amount <= 0) continue
        await tx.customerAllocation.create({
          data: { invoiceId: alloc.invoiceId, paymentId: paymentId || null, creditNoteId: creditNoteId || null, amount: alloc.amount },
        })
        const invoice = await tx.invoice.findUnique({ where: { id: alloc.invoiceId } })
        if (invoice) {
          const newPaid = invoice.paid + alloc.amount
          const newStatus = newPaid >= invoice.amount ? 'paid' : invoice.status === 'overdue' ? 'overdue' : invoice.status
          await tx.invoice.update({ where: { id: alloc.invoiceId }, data: { paid: newPaid, status: newStatus } })
        }
        created.push(alloc)
      }
      return created
    })
    return NextResponse.json({ allocations: result })
  } catch {
    return NextResponse.json({ error: 'Failed to save allocations' }, { status: 500 })
  }
}
