import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const adjustment = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: { items: { include: { item: { select: { id: true, name: true, sku: true } } } } },
    })
    if (!adjustment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ adjustment })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch adjustment' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()

    if (body.status === 'completed') {
      const adjustment = await prisma.stockAdjustment.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!adjustment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      for (const item of adjustment.items) {
        await prisma.inventoryItem.update({
          where: { id: item.itemId },
          data: { quantity: item.newQuantity },
        })
      }
    }

    const adjustment = await prisma.stockAdjustment.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        reason: body.reason,
        status: body.status,
      },
      include: {
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
    })
    return NextResponse.json({ adjustment })
  } catch {
    return NextResponse.json({ error: 'Failed to update adjustment' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const adjustment = await prisma.stockAdjustment.findUnique({ where: { id } })
    if (adjustment?.status === 'completed') {
      return NextResponse.json({ error: 'Cannot delete a completed adjustment' }, { status: 400 })
    }
    await prisma.stockAdjustment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete adjustment' }, { status: 500 })
  }
}