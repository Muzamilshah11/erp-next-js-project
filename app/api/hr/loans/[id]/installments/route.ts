import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const items = await prisma.loanInstallment.findMany({
      where: { loanId: id },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })
    return NextResponse.json({ installments: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch installments' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    if (body.month === undefined || body.year === undefined) {
      return NextResponse.json({ error: 'month and year are required' }, { status: 400 })
    }
    const loan = await prisma.employeeLoan.findUnique({ where: { id } })
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    const installment = await prisma.loanInstallment.create({
      data: { loanId: id, month: parseInt(body.month), year: parseInt(body.year), amount: body.amount || loan.installmentAmount, paid: body.paid === true, paidAt: body.paid ? new Date() : null },
    })
    if (installment.paid) {
      await prisma.employeeLoan.update({
        where: { id },
        data: { paidInstallments: { increment: 1 }, remainingAmount: { decrement: installment.amount } },
      })
    }
    return NextResponse.json({ installment })
  } catch {
    return NextResponse.json({ error: 'Failed to create installment' }, { status: 500 })
  }
}
