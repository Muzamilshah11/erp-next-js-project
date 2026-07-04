import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const statuses = await prisma.taskStatus.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { tasks: true } } } })
    return NextResponse.json({ statuses })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const maxSort = await prisma.taskStatus.aggregate({ _max: { sortOrder: true } })
    const status = await prisma.taskStatus.create({ data: { name: body.name, color: body.color || '#6b7280', sortOrder: (maxSort._max.sortOrder ?? 0) + 1, isDefault: body.isDefault || false } })
    return NextResponse.json({ status })
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}