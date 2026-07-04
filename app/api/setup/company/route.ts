import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const company = await prisma.company.findFirst()
    return NextResponse.json({ company })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json()
    const existing = await prisma.company.findFirst()
    const company = existing
      ? await prisma.company.update({ where: { id: existing.id }, data: body })
      : await prisma.company.create({ data: body })
    return NextResponse.json({ company })
  } catch {
    return NextResponse.json({ error: 'Failed to save company' }, { status: 500 })
  }
}
