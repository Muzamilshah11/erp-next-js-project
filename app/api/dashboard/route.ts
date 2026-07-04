import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      revenueAgg,
      ordersCount,
      inventoryAgg,
      activeCustomers,
      recentInvoices,
      itemsByCategory,
      recentOrders,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['paid', 'posted'] }, voidedAt: null },
      }),
      prisma.salesOrder.count(),
      prisma.inventoryItem.aggregate({
        _sum: { quantity: true, unitPrice: true },
        where: { status: { not: 'discontinued' } },
      }),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.invoice.findMany({
        where: { date: { gte: sixMonthsAgo }, voidedAt: null },
        select: { date: true, amount: true },
        orderBy: { date: 'asc' },
      }),
      prisma.inventoryItem.groupBy({
        by: ['category'],
        _count: true,
        orderBy: { _count: { category: 'desc' } },
      }),
      prisma.salesOrder.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { date: true, amount: true },
        orderBy: { date: 'asc' },
      }),
    ])

    const totalRevenue = revenueAgg._sum.amount || 0
    const invQty = inventoryAgg._sum.quantity || 0
    const invPrice = inventoryAgg._sum.unitPrice || 0
    const inventoryValue = invQty * invPrice

    const revenueByMonth: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${MONTHS[d.getMonth()]}`
      revenueByMonth[key] = 0
    }
    for (const inv of recentInvoices) {
      const key = `${MONTHS[inv.date.getMonth()]}`
      if (revenueByMonth[key] !== undefined) {
        revenueByMonth[key] += inv.amount
      }
    }
    const revenueTrend = Object.entries(revenueByMonth).map(([name, value]) => ({
      name,
      value,
      target: Math.round(value * 1.1),
    }))

    const totalCat = itemsByCategory.reduce((s, c) => s + c._count, 0) || 1
    const inventoryMix = itemsByCategory.map(c => ({
      name: c.category,
      value: Math.round((c._count / totalCat) * 100),
    }))

    const salesByMonth: Record<string, { name: string; sales: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${MONTHS[d.getMonth()]}`
      salesByMonth[key] = { name: key, sales: 0 }
    }
    for (const order of recentOrders) {
      const key = `${MONTHS[order.date.getMonth()]}`
      if (salesByMonth[key]) {
        salesByMonth[key].sales += order.amount
      }
    }
    const salesAnalysis = Object.values(salesByMonth).map(s => ({
      ...s,
      returns: Math.round(s.sales * 0.08),
    }))

    return NextResponse.json({
      kpis: {
        totalRevenue,
        orders: ordersCount,
        inventoryValue,
        activeCustomers,
      },
      revenueTrend,
      inventoryMix: inventoryMix.length > 0 ? inventoryMix : [
        { name: 'Uncategorized', value: 100 },
      ],
      salesAnalysis,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
