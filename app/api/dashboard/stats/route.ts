import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [employees, customers, invoices, items, accounts] = await Promise.all([
      prisma.employee.findMany(),
      prisma.customer.findMany(),
      prisma.invoice.findMany(),
      prisma.inventoryItem.findMany(),
      prisma.account.findMany(),
    ])

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid, 0)
    const totalValue = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const activeEmployees = employees.filter(e => e.status === 'active').length

    return NextResponse.json({
      totalRevenue,
      totalPaid,
      totalValue,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      totalEmployees: employees.length,
      activeEmployees,
      totalInvoices: invoices.length,
      totalItems: items.length,
      totalAccounts: accounts.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
