import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: { status: { not: 'cancelled' } },
      include: { supplier: { select: { id: true, name: true } }, items: true, grns: true },
      orderBy: { createdAt: 'desc' },
    })
    const outstanding = orders.map((order) => {
      const totalOrdered = order.items.reduce((sum, i) => sum + i.quantity, 0)
      const totalReceived = order.grns.reduce((sum, grn) => sum + grn.items.reduce((s, i) => s + i.quantity, 0), 0)
      return {
        id: order.id,
        orderNo: order.poNo,
        supplier: order.supplier,
        date: order.date,
        totalOrdered,
        totalReceived,
        balance: totalOrdered - totalReceived,
        status: order.status,
      }
    })
    return NextResponse.json({ outstanding })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch outstanding orders' }, { status: 500 })
  }
}
