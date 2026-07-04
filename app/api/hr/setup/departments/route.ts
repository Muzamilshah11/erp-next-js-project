import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.department.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ departments: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const item = await prisma.department.create({ data: { name: body.name, description: body.description } })
    return NextResponse.json({ department: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
  }
}
