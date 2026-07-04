import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const deliveryNote = await prisma.deliveryNote.findUnique({
      where: { id },
      include: { customer: true, invoice: true, order: true, items: true },
    })
    if (!deliveryNote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ deliveryNote })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch delivery note' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const deliveryNote = await prisma.deliveryNote.update({
      where: { id },
      data: {
        invoiceId: body.invoiceId ?? undefined,
        orderId: body.orderId ?? undefined,
        customerId: body.customerId,
        date: body.date ? new Date(body.date) : undefined,
        status: body.status,
      },
      include: { customer: true, items: true },
    })
    return NextResponse.json({ deliveryNote })
  } catch {
    return NextResponse.json({ error: 'Failed to update delivery note' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.deliveryNote.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete delivery note' }, { status: 500 })
  }
}