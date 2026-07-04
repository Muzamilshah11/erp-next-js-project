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
    const items = await prisma.overtime.findMany({
      where,
      include: { employee: { select: { id: true, name: true, employeeNo: true } }, approvedBy: { select: { id: true, fullName: true } } },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ overtimes: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch overtime' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || !body.date || !body.hours) {
      return NextResponse.json({ error: 'employeeId, date, and hours are required' }, { status: 400 })
    }
    const hours = parseFloat(body.hours)
    const emp = await prisma.employee.findUnique({ where: { id: body.employeeId } })
    const rate = parseFloat(body.rate) || emp?.overtimeRate || 1.5
    const basicDaily = emp ? emp.salary / 26 : 0
    const hourlyRate = basicDaily / 9
    const amount = hours * hourlyRate * rate
    const item = await prisma.overtime.create({
      data: { employeeId: body.employeeId, date: new Date(body.date), hours, rate, amount, approved: body.approved === true },
      include: { employee: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ overtime: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create overtime' }, { status: 500 })
  }
}
