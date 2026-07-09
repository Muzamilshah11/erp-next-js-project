import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (categoryId) where.categoryId = categoryId
    if (status) where.status = status
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' as const } }, { articleNo: { contains: q, mode: 'insensitive' as const } }]

    const articles = await prisma.knowledgeBaseArticle.findMany({
      where, include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    const count = await prisma.knowledgeBaseArticle.count()
    const articleNo = `ART-${String(count + 1).padStart(4, '0')}`
    const article = await prisma.knowledgeBaseArticle.create({
      data: { articleNo, title: body.title, content: body.content || null, categoryId: body.categoryId || null, tags: body.tags || null, fileAttachments: body.fileAttachments ? JSON.stringify(body.fileAttachments) : null, status: body.status || 'draft' },
      include: { category: { select: { name: true } } },
    })
    return NextResponse.json({ article })
  } catch {
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}