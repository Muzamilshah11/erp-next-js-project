import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const status = await prisma.ticketStatus.update({ where: { id }, data: { name: body.name, color: body.color, sortOrder: body.sortOrder, isDefault: body.isDefault } })
    return NextResponse.json({ status })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const s = await prisma.ticketStatus.findUnique({ where: { id }, include: { _count: { select: { tickets: true } } } })
    if ((s?._count.tickets ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete status with linked tickets' }, { status: 400 })
    await prisma.ticketStatus.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}