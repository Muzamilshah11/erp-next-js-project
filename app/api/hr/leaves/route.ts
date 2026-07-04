import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status
    const items = await prisma.leaveApplication.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, employeeNo: true } },
        leaveType: true,
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ leaves: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || !body.leaveTypeId || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'employeeId, leaveTypeId, startDate, endDate are required' }, { status: 400 })
    }
    const start = new Date(body.startDate); const end = new Date(body.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const item = await prisma.leaveApplication.create({
      data: { employeeId: body.employeeId, leaveTypeId: body.leaveTypeId, startDate: start, endDate: end, days, reason: body.reason },
      include: { employee: { select: { id: true, name: true } }, leaveType: true },
    })
    return NextResponse.json({ leave: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create leave' }, { status: 500 })
  }
}
