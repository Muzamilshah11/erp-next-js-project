import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const month = parseInt(body.month) || (new Date().getMonth() + 1)
    const year = parseInt(body.year) || new Date().getFullYear()

    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'active' },
      include: { allowances: true, deductions: true },
    })

    const created: Array<Record<string, unknown>> = []
    for (const emp of activeEmployees) {
      const existing = await prisma.payroll.findUnique({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
      })
      if (existing) continue

      const totalAllowances = emp.allowances.reduce((s, a) => s + a.amount, 0)
      const totalDeductions = emp.deductions.reduce((s, d) => s + d.amount, 0)
      const grossPay = emp.salary + totalAllowances
      const netPay = grossPay - totalDeductions

      const payroll = await prisma.payroll.create({
        data: { employeeId: emp.id, month, year, basicSalary: emp.salary, totalAllowances, totalDeductions, grossPay, netPay },
        include: { employee: { select: { id: true, name: true, department: true } } },
      })
      created.push(payroll)
    }

    return NextResponse.json({ payrolls: created, count: created.length })
  } catch {
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 })
  }
}