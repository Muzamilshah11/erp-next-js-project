import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const item = await prisma.gratuitySettlement.findUnique({ where: { id }, include: { employee: { select: { id: true, name: true, employeeNo: true } } } })
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
    const item = await prisma.gratuitySettlement.update({
      where: { id },
      data: { paid: body.paid === true, paidAt: body.paid ? new Date() : null, status: body.paid ? 'settled' : undefined },
    })
    return NextResponse.json({ settlement: item })
  } catch {
    return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 })
  }
}
