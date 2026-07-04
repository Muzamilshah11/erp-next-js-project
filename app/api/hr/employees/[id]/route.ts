import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } },
        allowances: true,
        deductions: true,
      },
    })
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ employee })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeNo: body.employeeNo,
        name: body.name,
        email: body.email,
        phone: body.phone,
        designationId: body.designationId || null,
        departmentId: body.departmentId || null,
        gradeId: body.gradeId || null,
        salary: parseFloat(body.salary),
        joinDate: body.joinDate ? new Date(body.joinDate) : undefined,
        status: body.status,
        bankName: body.bankName,
        bankAccount: body.bankAccount,
        bankBranch: body.bankBranch,
        bankCode: body.bankCode,
        overtimeRate: body.overtimeRate ? parseFloat(body.overtimeRate) : null,
      },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ employee })
  } catch {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.employee.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}