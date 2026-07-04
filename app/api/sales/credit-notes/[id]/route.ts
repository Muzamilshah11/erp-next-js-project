import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const creditNote = await prisma.customerCreditNote.findUnique({ where: { id }, include: { customer: true, items: { include: { item: true, warehouse: true } }, allocations: { include: { invoice: { select: { id: true, invoiceNo: true, amount: true, paid: true } } } } } })
    if (!creditNote) return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    return NextResponse.json({ creditNote })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch credit note' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const creditNote = await prisma.customerCreditNote.update({
      where: { id },
      data: {
        customerId: body.customerId,
        date: body.date ? new Date(body.date) : undefined,
        amount: body.amount,
        reason: body.reason,
        status: body.status,
        items: body.items ? { deleteMany: {}, create: body.items.map((item: { itemId?: string; warehouseId?: string; description: string; quantity: number; price: number }) => ({ itemId: item.itemId, warehouseId: item.warehouseId, description: item.description, quantity: item.quantity, price: item.price })) } : undefined,
      },
      include: { customer: true, items: true },
    })
    return NextResponse.json({ creditNote })
  } catch {
    return NextResponse.json({ error: 'Failed to update credit note' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.customerCreditNote.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete credit note' }, { status: 500 })
  }
}
