import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId
    if (month && year) {
      const y = parseInt(year); const m = parseInt(month)
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) }
    }
    const items = await prisma.attendance.findMany({
      where,
      include: { employee: { select: { id: true, name: true, employeeNo: true } } },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ attendance: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || !body.date) {
      return NextResponse.json({ error: 'employeeId and date are required' }, { status: 400 })
    }
    const item = await prisma.attendance.create({
      data: {
        employeeId: body.employeeId,
        date: new Date(body.date),
        timeIn: body.timeIn || null,
        timeOut: body.timeOut || null,
        status: body.status || 'present',
        hoursWorked: parseFloat(body.hoursWorked) || 0,
        overtimeHours: parseFloat(body.overtimeHours) || 0,
        source: body.source || 'manual',
      },
      include: { employee: { select: { id: true, name: true, employeeNo: true } } },
    })
    return NextResponse.json({ attendance: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create attendance' }, { status: 500 })
  }
}
