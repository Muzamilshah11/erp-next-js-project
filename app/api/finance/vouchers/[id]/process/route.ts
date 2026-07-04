import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const entry = await prisma.journalEntry.findUnique({ where: { id }, include: { lines: true } })
    if (!entry) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    if (entry.status !== 'draft') return NextResponse.json({ error: 'Only draft vouchers can be processed' }, { status: 400 })
    if (entry.totalDebit !== entry.totalCredit) return NextResponse.json({ error: 'Debit and credit totals must be equal' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      for (const line of entry.lines) {
        const account = await tx.account.findUnique({ where: { id: line.accountId } })
        if (!account) continue
        const change = (line.debit || 0) - (line.credit || 0)
        await tx.account.update({ where: { id: line.accountId }, data: { balance: { increment: change } } })
      }
      const updateData: Record<string, unknown> = { status: 'posted' }
      if (entry.type === 'bank-payment' || entry.type === 'bank-transfer') {
        if (entry.chequeNo) updateData.isCheque = true
      }
      await tx.journalEntry.update({ where: { id }, data: updateData })
    })

    const updated = await prisma.journalEntry.findUnique({ where: { id }, include: { lines: { include: { account: true } } } })
    return NextResponse.json({ entry: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to process voucher' }, { status: 500 })
  }
}
