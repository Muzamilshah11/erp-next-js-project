import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const grn = await prisma.gRN.findUnique({
      where: { id },
      include: { supplier: true, po: true, items: true },
    })
    if (!grn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ grn })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch GRN' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const grn = await prisma.gRN.update({
      where: { id },
      data: {
        poId: body.poId ?? undefined,
        supplierId: body.supplierId,
        date: body.date ? new Date(body.date) : undefined,
        status: body.status,
      },
      include: { supplier: true, items: true },
    })
    return NextResponse.json({ grn })
  } catch {
    return NextResponse.json({ error: 'Failed to update GRN' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.gRN.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete GRN' }, { status: 500 })
  }
}