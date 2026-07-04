import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const person = await prisma.salesPerson.findUnique({ where: { id }, include: { group: true, customers: true } })
    if (!person) return NextResponse.json({ error: 'Sales person not found' }, { status: 404 })
    return NextResponse.json({ person })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sales person' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const person = await prisma.salesPerson.update({ where: { id }, data: body })
    return NextResponse.json({ person })
  } catch {
    return NextResponse.json({ error: 'Failed to update sales person' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.salesPerson.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete sales person' }, { status: 500 })
  }
}
