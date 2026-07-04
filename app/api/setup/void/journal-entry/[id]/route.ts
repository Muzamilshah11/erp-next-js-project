import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params; const body = await request.json()
    if (!body.reason) return NextResponse.json({ error: 'Void reason is required' }, { status: 400 })
    const original = await prisma.journalEntry.findUnique({ where: { id }, include: { lines: true } })
    if (!original) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    if (original.voidedAt) return NextResponse.json({ error: 'Already voided' }, { status: 400 })
    if (original.status !== 'posted') return NextResponse.json({ error: 'Only posted entries can be voided' }, { status: 400 })
    if (original.isReversal) return NextResponse.json({ error: 'Cannot void a reversal entry' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      const cnt = await tx.journalEntry.count()
      const entryNo = `VOID-JE-${String(cnt + 1).padStart(6, '0')}`
      const reversalLines = original.lines.map(l => ({ accountId: l.accountId, debit: l.credit, credit: l.debit }))
      const totalDebit = reversalLines.reduce((s, l) => s + l.debit, 0)
      const totalCredit = reversalLines.reduce((s, l) => s + l.credit, 0)
      const reversal = await tx.journalEntry.create({
        data: {
          entryNo, type: 'journal', date: new Date(),
          description: `Void of ${original.entryNo}: ${body.reason}`,
          totalDebit, totalCredit, status: 'posted', isReversal: true, reversalOfId: original.id,
          lines: { create: reversalLines },
        },
      })
      for (const line of reversalLines) {
        await tx.account.update({ where: { id: line.accountId }, data: { balance: { increment: line.debit - line.credit } } })
      }
      await tx.journalEntry.update({
        where: { id },
        data: { voidedAt: new Date(), voidedBy: user.id, voidReason: body.reason, status: 'voided' },
      })
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to void journal entry' }, { status: 500 })
  }
}
