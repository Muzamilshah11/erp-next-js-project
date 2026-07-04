import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const source = await prisma.querySource.update({ where: { id }, data: { name: body.name, isDefault: body.isDefault } })
    return NextResponse.json({ source })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const s = await prisma.querySource.findUnique({ where: { id }, include: { _count: { select: { calls: true, queries: true } } } })
    if ((s?._count.calls ?? 0) > 0 || (s?._count.queries ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete source with linked records' }, { status: 400 })
    await prisma.querySource.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}