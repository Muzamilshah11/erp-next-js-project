import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const billId = searchParams.get('billId')?.trim()
    const paymentId = searchParams.get('paymentId')?.trim()
    const creditNoteId = searchParams.get('creditNoteId')?.trim()
    const where: Record<string, unknown> = {}
    if (billId) where.billId = billId
    if (paymentId) where.paymentId = paymentId
    if (creditNoteId) where.creditNoteId = creditNoteId
    const allocations = await prisma.supplierAllocation.findMany({
      where,
      include: { bill: { select: { id: true, billNo: true, amount: true, paid: true } }, payment: { select: { id: true, paymentNo: true, amount: true } }, creditNote: { select: { id: true, creditNoteNo: true, amount: true } } },
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
    const { paymentId, creditNoteId, billAllocations } = body

    if (!paymentId && !creditNoteId) return NextResponse.json({ error: 'paymentId or creditNoteId required' }, { status: 400 })
    if (!billAllocations?.length) return NextResponse.json({ error: 'billAllocations required' }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      const created = []
      for (const alloc of billAllocations) {
        if (alloc.amount <= 0) continue
        await tx.supplierAllocation.create({
          data: { billId: alloc.billId, paymentId: paymentId || null, creditNoteId: creditNoteId || null, amount: alloc.amount },
        })
        const bill = await tx.bill.findUnique({ where: { id: alloc.billId } })
        if (bill) {
          const newPaid = bill.paid + alloc.amount
          const newStatus = newPaid >= bill.amount ? 'paid' : bill.status === 'overdue' ? 'overdue' : bill.status
          await tx.bill.update({ where: { id: alloc.billId }, data: { paid: newPaid, status: newStatus } })
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
