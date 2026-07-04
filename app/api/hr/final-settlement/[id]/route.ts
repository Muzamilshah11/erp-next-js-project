import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const item = await prisma.finalSettlement.findUnique({ where: { id }, include: { employee: { select: { id: true, name: true, employeeNo: true } } } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ settlement: item })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settlement' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const data: Record<string, unknown> = { status: body.status || 'settled' }
    if (body.paid) { data.paid = true; data.paidAt = new Date() }
    const item = await prisma.finalSettlement.update({ where: { id }, data })
    return NextResponse.json({ settlement: item })
  } catch {
    return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 })
  }
}
