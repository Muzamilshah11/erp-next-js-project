import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const type = await prisma.callType.update({ where: { id }, data: { name: body.name, isDefault: body.isDefault } })
    return NextResponse.json({ type })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const t = await prisma.callType.findUnique({ where: { id }, include: { _count: { select: { calls: true } } } })
    if ((t?._count.calls ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete type with linked calls' }, { status: 400 })
    await prisma.callType.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}