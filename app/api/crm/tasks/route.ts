import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const assignedTo = searchParams.get('assignedTo')
    const statusId = searchParams.get('statusId')
    const priority = searchParams.get('priority')

    const where: Record<string, unknown> = {}
    if (assignedTo) where.assignedTo = assignedTo
    if (statusId) where.statusId = statusId
    if (priority) where.priority = priority
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { taskNo: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }]

    const tasks = await prisma.task.findMany({
      where, include: { assignee: { select: { id: true, fullName: true } }, status: { select: { id: true, name: true, color: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ tasks })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.title || !body.statusId) return NextResponse.json({ error: 'Title and status required' }, { status: 400 })
    const count = await prisma.task.count()
    const taskNo = `TSK-${String(count + 1).padStart(4, '0')}`
    const task = await prisma.task.create({
      data: { taskNo, title: body.title, description: body.description || null, assignedTo: body.assignedTo || null, priority: body.priority || 'medium', statusId: body.statusId, duration: body.duration || 0, dueDate: body.dueDate ? new Date(body.dueDate) : null },
      include: { assignee: { select: { fullName: true } }, status: { select: { name: true, color: true } } },
    })
    return NextResponse.json({ task })
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}