import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.title) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo
    if (body.priority) data.priority = body.priority
    if (body.statusId) data.statusId = body.statusId
    if (body.duration !== undefined) data.duration = body.duration
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    const task = await prisma.task.update({ where: { id }, data, include: { assignee: { select: { fullName: true } }, status: { select: { name: true, color: true } } } })
    return NextResponse.json({ task })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}