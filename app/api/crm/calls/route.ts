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
    if (q) where.OR = [{ subject: { contains: q, mode: 'insensitive' as const } }, { callNo: { contains: q, mode: 'insensitive' as const } }]

    const calls = await prisma.call.findMany({
      where, include: { customer: { select: { id: true, name: true } }, assignee: { select: { id: true, fullName: true } }, type: { select: { id: true, name: true } }, querySource: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ calls })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.customerId || !body.subject) return NextResponse.json({ error: 'Customer and subject required' }, { status: 400 })
    const count = await prisma.call.count()
    const callNo = `CAL-${String(count + 1).padStart(4, '0')}`
    const call = await prisma.call.create({
      data: { callNo, customerId: body.customerId, assignedTo: body.assignedTo || null, typeId: body.typeId || null, querySourceId: body.querySourceId || null, subject: body.subject, description: body.description || null, duration: body.duration || 0, date: body.date ? new Date(body.date) : new Date(), status: body.status || 'scheduled' },
      include: { customer: { select: { name: true } }, assignee: { select: { fullName: true } }, type: { select: { name: true } }, querySource: { select: { name: true } } },
    })
    return NextResponse.json({ call })
  } catch {
    return NextResponse.json({ error: 'Failed to create call' }, { status: 500 })
  }
}