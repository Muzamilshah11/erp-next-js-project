import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'tickets'

    if (type === 'tickets') {
      const [total, openCount, byPriority, recent] = await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.findMany({ where: { status: { name: 'Open' } }, take: 1 }).then(r => r.length > 0 ? prisma.ticket.count({ where: { status: { name: 'Open' } } }) : 0),
        prisma.ticket.groupBy({ by: ['priority'], _count: true }),
        prisma.ticket.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { customer: { select: { name: true } }, status: { select: { name: true, color: true } }, assignee: { select: { fullName: true } } } }),
      ])
      return NextResponse.json({ inquiry: { total, open: openCount, byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })), recent } })
    }

    if (type === 'tasks') {
      const [total, byStatus, recent] = await Promise.all([
        prisma.task.count(),
        prisma.task.groupBy({ by: ['statusId'], _count: true }),
        prisma.task.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { assignee: { select: { fullName: true } }, status: { select: { name: true, color: true } } } }),
      ])
      return NextResponse.json({ inquiry: { total, byStatus, recent } })
    }

    if (type === 'queries') {
      const [total, byStatus, recent] = await Promise.all([
        prisma.query.count(),
        prisma.query.groupBy({ by: ['status'], _count: true }),
        prisma.query.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { customer: { select: { name: true } }, assignee: { select: { fullName: true } }, source: { select: { name: true } } } }),
      ])
      return NextResponse.json({ inquiry: { total, byStatus, recent } })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch inquiry' }, { status: 500 })
  }
}