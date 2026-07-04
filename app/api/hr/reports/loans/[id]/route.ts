import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const item = await prisma.employeeLoan.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, employeeNo: true, department: { select: { name: true } }, designation: { select: { name: true } }, salary: true } },
        installments: { orderBy: [{ year: 'asc' }, { month: 'asc' }] },
      },
    })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ loan: item })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch loan report' }, { status: 500 })
  }
}
