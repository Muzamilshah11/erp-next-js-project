import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.finalSettlement.findMany({
      include: { employee: { select: { id: true, name: true, employeeNo: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ settlements: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch final settlements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || !body.settlementDate) {
      return NextResponse.json({ error: 'employeeId and settlementDate are required' }, { status: 400 })
    }
    const gratuityAmount = parseFloat(body.gratuityAmount) || 0
    const leaveEncashmentAmount = parseFloat(body.leaveEncashmentAmount) || 0
    const loanRecoveryAmount = parseFloat(body.loanRecoveryAmount) || 0
    const otherDeductions = parseFloat(body.otherDeductions) || 0
    const netAmount = gratuityAmount + leaveEncashmentAmount - loanRecoveryAmount - otherDeductions
    const item = await prisma.finalSettlement.create({
      data: {
        employeeId: body.employeeId,
        settlementDate: new Date(body.settlementDate),
        gratuityAmount,
        leaveEncashmentAmount,
        loanRecoveryAmount,
        otherDeductions,
        netAmount,
        status: 'draft',
      },
      include: { employee: { select: { id: true, name: true, employeeNo: true } } },
    })
    return NextResponse.json({ settlement: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create final settlement' }, { status: 500 })
  }
}
