import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const comments = await prisma.ticketComment.findMany({ where: { ticketId: id }, include: { user: { select: { fullName: true } } }, orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ comments })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    if (!body.body) return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    const comment = await prisma.ticketComment.create({ data: { ticketId: id, userId: body.userId || user.id, body: body.body }, include: { user: { select: { fullName: true } } } })
    return NextResponse.json({ comment })
  } catch {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}