import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  const where = accountId ? { accountId } : {}
  const transactions = await prisma.bankTransaction.findMany({
    where,
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ transactions })
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const lastTx = await prisma.bankTransaction.findFirst({
      where: { accountId: body.accountId },
      orderBy: { date: 'desc' },
    })
    const lastBalance = lastTx?.balance || 0
    const balance = lastBalance + (body.debit || 0) - (body.credit || 0)

    const transaction = await prisma.bankTransaction.create({
      data: {
        accountId: body.accountId,
        date: new Date(body.date),
        description: body.description,
        reference: body.reference || null,
        debit: body.debit || 0,
        credit: body.credit || 0,
        balance,
      },
    })
    return NextResponse.json({ transaction })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
