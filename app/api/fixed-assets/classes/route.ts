import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const classes = await prisma.assetClass.findMany({ include: { _count: { select: { assets: true } } }, orderBy: { name: 'asc' } })
    return NextResponse.json({ classes })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch asset classes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name || !body.usefulLife) return NextResponse.json({ error: 'Name and useful life are required' }, { status: 400 })
    const cls = await prisma.assetClass.create({ data: { name: body.name, description: body.description || null, usefulLife: body.usefulLife, salvageValue: body.salvageValue || 0, defaultRate: body.defaultRate || null } })
    return NextResponse.json({ class: cls })
  } catch {
    return NextResponse.json({ error: 'Failed to create asset class' }, { status: 500 })
  }
}