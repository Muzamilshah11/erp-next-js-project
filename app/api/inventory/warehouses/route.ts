import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { _count: { select: { inventoryItems: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ warehouses })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name || !body.code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 })
    }
    const warehouse = await prisma.warehouse.create({
      data: { name: body.name, code: body.code, location: body.location || '', capacity: body.capacity || 0 },
    })
    return NextResponse.json({ warehouse })
  } catch {
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 })
  }
}