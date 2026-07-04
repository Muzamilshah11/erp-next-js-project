import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json({ results: [] })

    const like = { contains: q, mode: 'insensitive' as const }
    const take = 5

    const [customers, suppliers, items, invoices, purchaseOrders, employees, accounts, journalEntries] = await Promise.all([
      prisma.customer.findMany({ where: { OR: [{ name: like }, { email: like }, { phone: like }] }, take, select: { id: true, name: true } }),
      prisma.supplier.findMany({ where: { OR: [{ name: like }, { email: like }] }, take, select: { id: true, name: true } }),
      prisma.inventoryItem.findMany({ where: { OR: [{ name: like }, { sku: like }] }, take, select: { id: true, name: true, sku: true } }),
      prisma.invoice.findMany({ where: { OR: [{ invoiceNo: like }, { customer: { name: like } }] }, take, select: { id: true, invoiceNo: true } }),
      prisma.purchaseOrder.findMany({ where: { OR: [{ poNo: like }, { supplier: { name: like } }] }, take, select: { id: true, poNo: true } }),
      prisma.employee.findMany({ where: { OR: [{ name: like }, { employeeNo: like }, { email: like }] }, take, select: { id: true, name: true, employeeNo: true } }),
      prisma.account.findMany({ where: { OR: [{ name: like }, { code: like }] }, take, select: { id: true, name: true, code: true } }),
      prisma.journalEntry.findMany({ where: { OR: [{ entryNo: like }, { description: like }] }, take, select: { id: true, entryNo: true, description: true } }),
    ])

    const results = [
      ...customers.map(r => ({ id: r.id, label: r.name, type: 'Customer', href: `/sales/customers` })),
      ...suppliers.map(r => ({ id: r.id, label: r.name, type: 'Supplier', href: `/purchases/suppliers` })),
      ...items.map(r => ({ id: r.id, label: `${r.name} (${r.sku})`, type: 'Item', href: `/inventory/items` })),
      ...invoices.map(r => ({ id: r.id, label: r.invoiceNo, type: 'Invoice', href: `/sales/invoices` })),
      ...purchaseOrders.map(r => ({ id: r.id, label: r.poNo, type: 'Purchase Order', href: `/purchases/orders` })),
      ...employees.map(r => ({ id: r.id, label: `${r.name} (${r.employeeNo || ''})`, type: 'Employee', href: `/hr` })),
      ...accounts.map(r => ({ id: r.id, label: `${r.code} - ${r.name}`, type: 'Account', href: `/finance/chart-of-accounts` })),
      ...journalEntries.map(r => ({ id: r.id, label: `${r.entryNo} - ${r.description || ''}`, type: 'Journal Entry', href: `/finance/journal-entries` })),
    ]

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
