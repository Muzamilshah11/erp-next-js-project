import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params
    const body = await request.json()
    if (!body.reason) return NextResponse.json({ error: 'Void reason is required' }, { status: 400 })

    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { allocations: true } })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    if (invoice.voidedAt) return NextResponse.json({ error: 'Already voided' }, { status: 400 })
    if (invoice.status !== 'posted') return NextResponse.json({ error: 'Only posted invoices can be voided' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      const cnt = await tx.journalEntry.count()
      const entryNo = `VOID-INV-${String(cnt + 1).padStart(6, '0')}`
      const reversal = await tx.journalEntry.create({
        data: {
          entryNo,
          type: 'journal',
          date: new Date(),
          description: `Void of Invoice ${invoice.invoiceNo}: ${body.reason}`,
          totalDebit: 0, totalCredit: 0,
          status: 'posted',
          isReversal: true,
          reversalOfId: null,
        },
      })
      await tx.invoice.update({
        where: { id },
        data: { voidedAt: new Date(), voidedBy: user.id, voidReason: body.reason, status: 'voided', reversalEntryId: reversal.id },
      })
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to void invoice' }, { status: 500 })
  }
}
