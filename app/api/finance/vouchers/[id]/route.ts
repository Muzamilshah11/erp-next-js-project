import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const entry = await prisma.journalEntry.findUnique({ where: { id }, include: { lines: { include: { account: true } } } })
    if (!entry) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    return NextResponse.json({ entry })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch voucher' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.date) data.date = new Date(body.date)
    if (body.description !== undefined) data.description = body.description
    if (body.totalDebit !== undefined) data.totalDebit = body.totalDebit
    if (body.totalCredit !== undefined) data.totalCredit = body.totalCredit
    if (body.status !== undefined) data.status = body.status
    if (body.payee !== undefined) data.payee = body.payee
    if (body.reference !== undefined) data.reference = body.reference
    if (body.chequeNo !== undefined) data.chequeNo = body.chequeNo
    if (body.chequeDate !== undefined) data.chequeDate = body.chequeDate ? new Date(body.chequeDate) : null
    if (body.isCheque !== undefined) data.isCheque = body.isCheque
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...data,
        lines: body.lines ? { deleteMany: {}, create: body.lines.map((line: { accountId: string; debit: number; credit: number }) => ({ accountId: line.accountId, debit: line.debit || 0, credit: line.credit || 0 })) } : undefined,
      },
      include: { lines: { include: { account: true } } },
    })
    return NextResponse.json({ entry })
  } catch {
    return NextResponse.json({ error: 'Failed to update voucher' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.journalLine.deleteMany({ where: { journalEntryId: id } })
    await prisma.journalEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete voucher' }, { status: 500 })
  }
}
