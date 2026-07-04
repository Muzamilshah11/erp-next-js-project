import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month'); const year = searchParams.get('year')
    const employeeId = searchParams.get('employeeId'); const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status

    const payrolls = await prisma.payroll.findMany({
      where,
      include: { employee: { select: { id: true, name: true, department: true, designation: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
    return NextResponse.json({ payrolls })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || !body.month || !body.year) {
      return NextResponse.json({ error: 'employeeId, month, and year are required' }, { status: 400 })
    }

    const employee = await prisma.employee.findUnique({
      where: { id: body.employeeId },
      include: { allowances: true, deductions: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const totalAllowances = employee.allowances.reduce((s, a) => s + a.amount, 0)
    const totalDeductions = employee.deductions.reduce((s, d) => s + d.amount, 0)
    const grossPay = employee.salary + totalAllowances
    const netPay = grossPay - totalDeductions

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: body.employeeId,
        month: parseInt(body.month),
        year: parseInt(body.year),
        basicSalary: employee.salary,
        totalAllowances,
        totalDeductions,
        grossPay,
        netPay,
        status: body.status || 'pending',
        remarks: body.remarks || null,
      },
      include: { employee: { select: { id: true, name: true, department: true, designation: true } } },
    })
    return NextResponse.json({ payroll })
  } catch {
    return NextResponse.json({ error: 'Failed to create payroll' }, { status: 500 })
  }
}