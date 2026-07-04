import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const categories = await prisma.assetCategory.findMany({ include: { _count: { select: { assets: true } } }, orderBy: { name: 'asc' } })
    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const category = await prisma.assetCategory.create({ data: { name: body.name, description: body.description || null } })
    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}