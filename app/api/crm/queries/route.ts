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
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (customerId) where.customerId = customerId
    if (assignedTo) where.assignedTo = assignedTo
    if (status) where.status = status
    if (q) where.OR = [{ subject: { contains: q, mode: 'insensitive' } }, { queryNo: { contains: q, mode: 'insensitive' } }]

    const queries = await prisma.query.findMany({
      where, include: { customer: { select: { id: true, name: true } }, assignee: { select: { id: true, fullName: true } }, source: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ queries })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch queries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.customerId || !body.subject) return NextResponse.json({ error: 'Customer and subject required' }, { status: 400 })
    const count = await prisma.query.count()
    const queryNo = `QRY-${String(count + 1).padStart(4, '0')}`
    const query = await prisma.query.create({
      data: { queryNo, customerId: body.customerId, assignedTo: body.assignedTo || null, sourceId: body.sourceId || null, subject: body.subject, description: body.description || null, status: body.status || 'open' },
      include: { customer: { select: { name: true } }, assignee: { select: { fullName: true } }, source: { select: { name: true } } },
    })
    return NextResponse.json({ query })
  } catch {
    return NextResponse.json({ error: 'Failed to create query' }, { status: 500 })
  }
}