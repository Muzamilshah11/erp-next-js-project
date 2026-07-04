import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const warehouse = await prisma.warehouse.findUnique({ where: { id }, include: { _count: { select: { inventoryItems: true } } } })
    if (!warehouse) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ warehouse })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: { name: body.name, code: body.code, location: body.location, capacity: body.capacity, status: body.status },
    })
    return NextResponse.json({ warehouse })
  } catch {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.warehouse.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete warehouse' }, { status: 500 })
  }
}