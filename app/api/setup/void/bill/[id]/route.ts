import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params; const body = await request.json()
    if (!body.reason) return NextResponse.json({ error: 'Void reason is required' }, { status: 400 })
    const bill = await prisma.bill.findUnique({ where: { id }, include: { allocations: true } })
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    if (bill.voidedAt) return NextResponse.json({ error: 'Already voided' }, { status: 400 })
    if (bill.status !== 'posted') return NextResponse.json({ error: 'Only posted bills can be voided' }, { status: 400 })
    await prisma.$transaction(async (tx) => {
      const cnt = await tx.journalEntry.count()
      const entryNo = `VOID-BILL-${String(cnt + 1).padStart(6, '0')}`
      const reversal = await tx.journalEntry.create({
        data: { entryNo, type: 'journal', date: new Date(), description: `Void of Bill ${bill.billNo}: ${body.reason}`, totalDebit: 0, totalCredit: 0, status: 'posted', isReversal: true },
      })
      await tx.bill.update({
        where: { id },
        data: { voidedAt: new Date(), voidedBy: user.id, voidReason: body.reason, status: 'voided', reversalEntryId: reversal.id },
      })
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to void bill' }, { status: 500 })
  }
}
