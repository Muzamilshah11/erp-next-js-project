import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const article = await prisma.knowledgeBaseArticle.findUnique({ where: { id }, include: { category: { select: { id: true, name: true } } } })
    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ article })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.title) data.title = body.title
    if (body.content !== undefined) data.content = body.content
    if (body.categoryId !== undefined) data.categoryId = body.categoryId
    if (body.tags !== undefined) data.tags = body.tags
    if (body.fileAttachments !== undefined) data.fileAttachments = body.fileAttachments
    if (body.status) data.status = body.status
    const article = await prisma.knowledgeBaseArticle.update({ where: { id }, data, include: { category: { select: { name: true } } } })
    return NextResponse.json({ article })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; await prisma.knowledgeBaseArticle.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}