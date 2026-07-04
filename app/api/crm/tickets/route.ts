import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const customerId = searchParams.get('customerId')
    const assignedTo = searchParams.get('assignedTo')
    const statusId = searchParams.get('statusId')
    const priority = searchParams.get('priority')

    const where: Record<string, unknown> = {}
    if (customerId) where.customerId = customerId
    if (assignedTo) where.assignedTo = assignedTo
    if (statusId) where.statusId = statusId
    if (priority) where.priority = priority
    if (q) where.OR = [{ subject: { contains: q, mode: 'insensitive' } }, { ticketNo: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }]

    const tickets = await prisma.ticket.findMany({
      where, include: { customer: { select: { id: true, name: true } }, assignee: { select: { id: true, fullName: true } }, status: { select: { id: true, name: true, color: true } }, _count: { select: { comments: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ tickets })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.customerId || !body.subject || !body.statusId) {
      return NextResponse.json({ error: 'Customer, subject, and status are required' }, { status: 400 })
    }
    const count = await prisma.ticket.count()
    const ticketNo = `TKT-${String(count + 1).padStart(4, '0')}`
    const ticket = await prisma.ticket.create({
      data: { ticketNo, customerId: body.customerId, assignedTo: body.assignedTo || null, subject: body.subject, description: body.description || null, priority: body.priority || 'medium', statusId: body.statusId, dueDate: body.dueDate ? new Date(body.dueDate) : null },
      include: { customer: { select: { name: true } }, assignee: { select: { fullName: true } }, status: { select: { name: true, color: true } } },
    })
    return NextResponse.json({ ticket })
  } catch {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}