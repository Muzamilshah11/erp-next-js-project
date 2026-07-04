import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId
    const items = await prisma.employeeLoan.findMany({
      where,
      include: { employee: { select: { id: true, name: true, employeeNo: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ loans: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || !body.amount || !body.totalInstallments) {
      return NextResponse.json({ error: 'employeeId, amount, and totalInstallments are required' }, { status: 400 })
    }
    const amount = parseFloat(body.amount)
    const totalInstallments = parseInt(body.totalInstallments)
    const installmentAmount = amount / totalInstallments
    const count = await prisma.employeeLoan.count()
    const loanNo = `LN-${String(count + 1).padStart(4, '0')}`
    const item = await prisma.employeeLoan.create({
      data: {
        employeeId: body.employeeId,
        loanNo,
        amount,
        totalInstallments,
        remainingAmount: amount,
        installmentAmount,
        purpose: body.purpose,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
      },
      include: { employee: { select: { id: true, name: true, employeeNo: true } } },
    })
    return NextResponse.json({ loan: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
  }
}
