import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const q = searchParams.get('q')?.trim()
    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (status) where.status = status
    if (q) {
      where.OR = [
        { entryNo: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { payee: { contains: q, mode: 'insensitive' as const } },
      ]
    }
    const entries = await prisma.journalEntry.findMany({
      where,
      include: { lines: { include: { account: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const count = await prisma.journalEntry.count()
    const year = new Date().getFullYear()
    const prefix = body.type === 'bank-payment' ? 'BP' : body.type === 'bank-deposit' ? 'BD' : body.type === 'cash-payment' ? 'CP' : body.type === 'cash-receipt' ? 'CR' : body.type === 'bank-transfer' ? 'BT' : body.type === 'bulk' ? 'BV' : 'JE'
    const entryNo = `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`
    const entry = await prisma.journalEntry.create({
      data: {
        entryNo,
        type: body.type || 'journal',
        date: new Date(body.date),
        description: body.description || '',
        totalDebit: body.totalDebit || 0,
        totalCredit: body.totalCredit || 0,
        status: body.status || 'draft',
        payee: body.payee || null,
        reference: body.reference || null,
        chequeNo: body.chequeNo || null,
        chequeDate: body.chequeDate ? new Date(body.chequeDate) : null,
        isCheque: body.isCheque || false,
        lines: {
          create: (body.lines ?? []).map((line: { accountId: string; debit: number; credit: number }) => ({
            accountId: line.accountId,
            debit: line.debit || 0,
            credit: line.credit || 0,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    })
    return NextResponse.json({ entry })
  } catch {
    return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 })
  }
}
