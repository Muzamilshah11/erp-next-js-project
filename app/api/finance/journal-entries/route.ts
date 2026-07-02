import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entries = await prisma.journalEntry.findMany({
    include: { lines: { include: { account: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ entries })
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const count = await prisma.journalEntry.count()
    const entryNo = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`

    const entry = await prisma.journalEntry.create({
      data: {
        entryNo,
        date: new Date(body.date),
        description: body.description,
        totalDebit: body.totalDebit || 0,
        totalCredit: body.totalCredit || 0,
        status: body.status || 'draft',
        lines: {
          create: body.lines?.map((line: { accountId: string; debit: number; credit: number }) => ({
            accountId: line.accountId,
            debit: line.debit || 0,
            credit: line.credit || 0,
          })) || [],
        },
      },
      include: { lines: { include: { account: true } } },
    })
    return NextResponse.json({ entry })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}
