import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const groups = await prisma.salesGroup.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ groups })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const group = await prisma.salesGroup.create({ data: { name: body.name, description: body.description } })
    return NextResponse.json({ group })
  } catch {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
