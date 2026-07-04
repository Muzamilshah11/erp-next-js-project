import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.customerId) data.customerId = body.customerId
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo
    if (body.subject) data.subject = body.subject
    if (body.description !== undefined) data.description = body.description
    if (body.typeId !== undefined) data.typeId = body.typeId
    if (body.querySourceId !== undefined) data.querySourceId = body.querySourceId
    if (body.duration !== undefined) data.duration = body.duration
    if (body.date) data.date = new Date(body.date)
    if (body.status) data.status = body.status
    const call = await prisma.call.update({ where: { id }, data })
    return NextResponse.json({ call })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; await prisma.call.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}