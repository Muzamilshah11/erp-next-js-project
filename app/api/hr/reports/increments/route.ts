import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId
    if (fromDate || toDate) {
      where.effectiveFrom = {}
      if (fromDate) where.effectiveFrom.gte = new Date(fromDate)
      if (toDate) where.effectiveFrom.lte = new Date(toDate)
    }
    const items = await prisma.salaryIncrement.findMany({
      where,
      include: { employee: { select: { id: true, name: true, employeeNo: true, department: { select: { name: true } } } }, approvedBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ increments: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch increment report' }, { status: 500 })
  }
}
