import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: { employee: { select: { id: true, name: true, email: true, phone: true, department: true, designation: true, salary: true } } },
    })
    if (!payroll) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ payroll })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.status) data.status = body.status
    if (body.status === 'paid') data.paidAt = new Date()
    if (body.paymentMethod) data.paymentMethod = body.paymentMethod
    if (body.remarks !== undefined) data.remarks = body.remarks

    const payroll = await prisma.payroll.update({
      where: { id }, data,
      include: { employee: { select: { id: true, name: true, department: true } } },
    })
    return NextResponse.json({ payroll })
  } catch {
    return NextResponse.json({ error: 'Failed to update payroll' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const payroll = await prisma.payroll.findUnique({ where: { id } })
    if (payroll?.status === 'paid') return NextResponse.json({ error: 'Cannot delete a paid payroll' }, { status: 400 })
    await prisma.payroll.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete payroll' }, { status: 500 })
  }
}