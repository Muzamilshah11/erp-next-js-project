import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params; const body = await request.json()
    if (body.isActive) await prisma.fiscalYear.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } })
    const item = await prisma.fiscalYear.update({ where: { id }, data: { name: body.name, startDate: body.startDate ? new Date(body.startDate) : undefined, endDate: body.endDate ? new Date(body.endDate) : undefined, isActive: body.isActive } })
    return NextResponse.json({ fiscalYear: item })
  } catch {
    return NextResponse.json({ error: 'Failed to update fiscal year' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params; await prisma.fiscalYear.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete fiscal year' }, { status: 500 })
  }
}
