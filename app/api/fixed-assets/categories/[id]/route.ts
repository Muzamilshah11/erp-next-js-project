import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const category = await prisma.assetCategory.update({ where: { id }, data: { name: body.name, description: body.description } })
    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const cat = await prisma.assetCategory.findUnique({ where: { id }, include: { _count: { select: { assets: true } } } })
    if ((cat?._count.assets ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete category with linked assets' }, { status: 400 })
    await prisma.assetCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}