import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
  }

  try {
    const account = await prisma.account.findUnique({ where: { id: accountId } })
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const lines = await prisma.journalLine.findMany({
      where: { accountId },
      include: { journalEntry: true },
      orderBy: { journalEntry: { date: 'asc' } },
    })

    let runningBalance = account.balance
    const transactions = lines.map((line) => {
      runningBalance += line.debit - line.credit
      return {
        date: line.journalEntry.date,
        entryNo: line.journalEntry.entryNo,
        description: line.journalEntry.description,
        debit: line.debit,
        credit: line.credit,
        balance: runningBalance,
      }
    })

    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0)
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0)

    return NextResponse.json({
      account: { id: account.id, code: account.code, name: account.name, type: account.type },
      transactions,
      summary: {
        openingBalance: account.balance,
        totalDebit,
        totalCredit,
        closingBalance: account.balance + totalDebit - totalCredit,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
  }
}
