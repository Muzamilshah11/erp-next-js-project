import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { employeeNo: { contains: q, mode: 'insensitive' } },
      ],
    } : {}

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } },
        allowances: true,
        deductions: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ employees })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    const count = await prisma.employee.count()
    const employeeNo = body.employeeNo || `EMP-${String(count + 1).padStart(4, '0')}`
    const employee = await prisma.employee.create({
      data: {
        employeeNo,
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        designationId: body.designationId || null,
        departmentId: body.departmentId || null,
        gradeId: body.gradeId || null,
        salary: parseFloat(body.salary) || 0,
        joinDate: body.joinDate ? new Date(body.joinDate) : new Date(),
        status: body.status || 'active',
        bankName: body.bankName || null,
        bankAccount: body.bankAccount || null,
        bankBranch: body.bankBranch || null,
        bankCode: body.bankCode || null,
        overtimeRate: body.overtimeRate ? parseFloat(body.overtimeRate) : null,
      },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ employee })
  } catch {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}