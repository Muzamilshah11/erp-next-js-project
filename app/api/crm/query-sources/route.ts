import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const sources = await prisma.querySource.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { calls: true, queries: true } } } })
    return NextResponse.json({ sources })
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
    const source = await prisma.querySource.create({ data: { name: body.name, isDefault: body.isDefault || false } })
    return NextResponse.json({ source })
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}