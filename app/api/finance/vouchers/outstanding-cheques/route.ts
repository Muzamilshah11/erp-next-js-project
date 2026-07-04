import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { isCheque: true, isCleared: false },
      include: { lines: { include: { account: true } } },
      orderBy: { date: 'desc' },
    })
    const cheques = entries.map((e) => {
      const bankLine = e.lines.find(l => l.account.subType === 'bank')
      return {
        id: e.id,
        entryNo: e.entryNo,
        date: e.date,
        chequeNo: e.chequeNo,
        payee: e.payee,
        description: e.description,
        amount: e.totalDebit,
        bankAccount: bankLine?.account?.name || 'N/A',
        bankAccountId: bankLine?.accountId || null,
      }
    })
    return NextResponse.json({ cheques })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch outstanding cheques' }, { status: 500 })
  }
}
