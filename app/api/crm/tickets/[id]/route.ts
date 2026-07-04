import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const ticket = await prisma.ticket.findUnique({
      where: { id }, include: { customer: { select: { id: true, name: true, email: true, phone: true } }, assignee: { select: { id: true, fullName: true, email: true } }, status: { select: { id: true, name: true, color: true } }, comments: { include: { user: { select: { fullName: true } } }, orderBy: { createdAt: 'asc' } } },
    })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ticket })
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
    if (body.customerId) data.customerId = body.customerId
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo
    if (body.subject) data.subject = body.subject
    if (body.description !== undefined) data.description = body.description
    if (body.priority) data.priority = body.priority
    if (body.statusId) data.statusId = body.statusId
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null

    const ticket = await prisma.ticket.update({ where: { id }, data, include: { customer: { select: { name: true } }, assignee: { select: { fullName: true } }, status: { select: { name: true, color: true } } } })
    return NextResponse.json({ ticket })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; await prisma.ticket.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}