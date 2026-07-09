import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

function calcTax(annualIncome: number, fiscalYear: string): number {
  const slabs = [
    { min: 0, max: 600000, rate: 0, fixed: 0 },
    { min: 600000, max: 1200000, rate: 0.05, fixed: 0 },
    { min: 1200000, max: 2400000, rate: 0.15, fixed: 30000 },
    { min: 2400000, max: 3600000, rate: 0.25, fixed: 210000 },
    { min: 3600000, max: 6000000, rate: 0.35, fixed: 510000 },
    { min: 6000000, max: Infinity, rate: 0.45, fixed: 1350000 },
  ]
  for (const slab of slabs) {
    if (annualIncome > slab.min && annualIncome <= slab.max) {
      return slab.fixed + (annualIncome - slab.min) * slab.rate
    }
  }
  return 0
}

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

    const taxSlabs = await prisma.taxSlab.findMany({ where: { fiscalYear: String(year) }, orderBy: { minIncome: 'asc' } })

    const created: Array<Record<string, unknown>> = []
    for (const emp of activeEmployees) {
      const existing = await prisma.payroll.findUnique({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
      })
      if (existing) continue

      const totalAllowances = emp.allowances.reduce((s, a) => s + a.amount, 0)
      const totalDeductions = emp.deductions.reduce((s, d) => s + d.amount, 0)
      const grossPay = emp.salary + totalAllowances

      const otRecords = await prisma.overtime.findMany({
        where: { employeeId: emp.id, date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) }, approved: true },
      })
      const overtimeAmount = otRecords.reduce((s, o) => s + o.amount, 0)

      const activeLoan = await prisma.employeeLoan.findFirst({
        where: { employeeId: emp.id, status: 'active' },
      })
      const loanInstallmentAmount = activeLoan && activeLoan.remainingAmount > 0 ? activeLoan.installmentAmount : 0

      const leaveDays = await prisma.leaveApplication.count({
        where: { employeeId: emp.id, startDate: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) }, status: 'approved' },
      })
      const leavesDeduction = leaveDays > 0 ? (emp.salary / 26) * leaveDays : 0

      const annualIncome = (emp.salary + totalAllowances) * 12
      let taxAmount = 0
      if (taxSlabs.length > 0) {
        const slab = taxSlabs.find(s => annualIncome > s.minIncome && (!s.maxIncome || annualIncome <= s.maxIncome))
        if (slab) taxAmount = (slab.fixedAmount + (annualIncome - slab.minIncome) * slab.rate) / 12
      } else {
        taxAmount = calcTax(annualIncome, String(year)) / 12
      }

      const otherDeductions = totalDeductions
      const netPay = grossPay + overtimeAmount - loanInstallmentAmount - leavesDeduction - taxAmount - otherDeductions

      const payroll = await prisma.payroll.create({
        data: {
          employeeId: emp.id, month, year, basicSalary: emp.salary,
          totalAllowances, totalDeductions: otherDeductions,
          overtimeAmount, loanInstallmentAmount, leavesDeduction, taxAmount, otherDeductions,
          grossPay, netPay,
        },
        include: { employee: { select: { id: true, name: true, department: { select: { name: true } }, designation: { select: { name: true } } } } },
      })
      created.push(payroll)
    }

    return NextResponse.json({ payrolls: created, count: created.length })
  } catch {
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 })
  }
}