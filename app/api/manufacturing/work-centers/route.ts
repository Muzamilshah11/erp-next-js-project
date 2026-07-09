import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const workCenters = await prisma.workCenter.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ workCenters })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch work centers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const workCenter = await prisma.workCenter.create({ data: { name: body.name, description: body.description || null, status: body.status || 'active' } })
    return NextResponse.json({ workCenter })
  } catch {
    return NextResponse.json({ error: 'Failed to create work center' }, { status: 500 })
  }
}