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
    const items = await prisma.salaryIncrement.findMany({
      where,
      include: { employee: { select: { id: true, name: true, employeeNo: true } }, approvedBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ increments: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch increments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || body.newSalary === undefined) {
      return NextResponse.json({ error: 'employeeId and newSalary are required' }, { status: 400 })
    }
    const emp = await prisma.employee.findUnique({ where: { id: body.employeeId } })
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    const item = await prisma.salaryIncrement.create({
      data: { employeeId: body.employeeId, previousSalary: emp.salary, newSalary: parseFloat(body.newSalary), effectiveFrom: new Date(body.effectiveFrom), reason: body.reason, approvedById: user.id },
      include: { employee: { select: { id: true, name: true } } },
    })
    await prisma.employee.update({ where: { id: body.employeeId }, data: { salary: parseFloat(body.newSalary) } })
    return NextResponse.json({ increment: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create increment' }, { status: 500 })
  }
}
