import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || !body.settlementDate) {
      return NextResponse.json({ error: 'employeeId and settlementDate are required' }, { status: 400 })
    }
    const emp = await prisma.employee.findUnique({ where: { id: body.employeeId } })
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    const joinDate = new Date(emp.joinDate)
    const settlementDate = new Date(body.settlementDate)
    const years = (settlementDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    let gratuityAmount = 0
    const basicDaily = emp.salary / 26
    if (years <= 5) {
      gratuityAmount = basicDaily * 21 * years
    } else {
      gratuityAmount = basicDaily * (21 * 5 + 41 * (years - 5))
    }
    return NextResponse.json({ employeeId: emp.id, employeeName: emp.name, joinDate: emp.joinDate, settlementDate, totalYears: Math.round(years * 100) / 100, basicSalary: emp.salary, basicDaily, gratuityAmount: Math.round(gratuityAmount) })
  } catch {
    return NextResponse.json({ error: 'Failed to calculate gratuity' }, { status: 500 })
  }
}
