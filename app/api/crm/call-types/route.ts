import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const types = await prisma.callType.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { calls: true } } } })
    return NextResponse.json({ types })
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
    const type = await prisma.callType.create({ data: { name: body.name, isDefault: body.isDefault || false } })
    return NextResponse.json({ type })
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}