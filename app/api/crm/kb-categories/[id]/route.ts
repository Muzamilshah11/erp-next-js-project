import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const cat = await prisma.kbCategory.update({ where: { id }, data: { name: body.name, description: body.description, parentId: body.parentId } })
    return NextResponse.json({ category: cat })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const c = await prisma.kbCategory.findUnique({ where: { id }, include: { _count: { select: { articles: true, children: true } } } })
    if ((c?._count.articles ?? 0) > 0 || (c?._count.children ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete category with articles or subcategories' }, { status: 400 })
    await prisma.kbCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}