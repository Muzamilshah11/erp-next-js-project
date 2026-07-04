import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params; const body = await request.json()
    if (body.isDefault) await prisma.taxRate.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } })
    const item = await prisma.taxRate.update({ where: { id }, data: { name: body.name, rate: parseFloat(body.rate), isDefault: body.isDefault, applicableTo: body.applicableTo, status: body.status } })
    return NextResponse.json({ taxRate: item })
  } catch {
    return NextResponse.json({ error: 'Failed to update tax rate' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params; await prisma.taxRate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete tax rate' }, { status: 500 })
  }
}
