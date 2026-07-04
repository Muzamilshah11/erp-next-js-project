import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const groupId = searchParams.get('groupId')?.trim()
    const where: Record<string, unknown> = {}
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }]
    if (groupId) where.groupId = groupId
    const persons = await prisma.salesPerson.findMany({ where, include: { group: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ persons })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch persons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const person = await prisma.salesPerson.create({ data: { name: body.name, email: body.email, phone: body.phone, commissionRate: body.commissionRate ?? 0, groupId: body.groupId, status: body.status ?? 'active' } })
    return NextResponse.json({ person })
  } catch {
    return NextResponse.json({ error: 'Failed to create sales person' }, { status: 500 })
  }
}
