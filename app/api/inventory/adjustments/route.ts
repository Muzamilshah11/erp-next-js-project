import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const where = q ? { OR: [{ adjustmentNo: { contains: q, mode: 'insensitive' as const } }] } : {}

    const adjustments = await prisma.stockAdjustment.findMany({
      where,
      include: {
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ adjustments })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.date || !body.reason || !body.items?.length) {
      return NextResponse.json({ error: 'date, reason, and items are required' }, { status: 400 })
    }

    const prefix = 'ADJ-'
    const count = await prisma.stockAdjustment.count()
    const adjustmentNo = `${prefix}${String(count + 1).padStart(4, '0')}`

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        adjustmentNo,
        date: new Date(body.date),
        reason: body.reason,
        status: body.status || 'draft',
        items: {
          create: body.items.map((item: { itemId: string; oldQuantity: number; newQuantity: number }) => ({
            itemId: item.itemId,
            oldQuantity: item.oldQuantity,
            newQuantity: item.newQuantity,
            difference: item.newQuantity - item.oldQuantity,
          })),
        },
      },
      include: {
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
    })
    return NextResponse.json({ adjustment })
  } catch {
    return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 })
  }
}