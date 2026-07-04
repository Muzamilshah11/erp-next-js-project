import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const categories = await prisma.kbCategory.findMany({ include: { _count: { select: { articles: true } }, children: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const cat = await prisma.kbCategory.create({ data: { name: body.name, description: body.description || null, parentId: body.parentId || null } })
    return NextResponse.json({ category: cat })
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}