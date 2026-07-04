import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { type, records } = body
    if (!type || !records?.length) return NextResponse.json({ error: 'type and records required' }, { status: 400 })

    const results = []
    for (const record of records) {
      try {
        if (type === 'customers') {
          const customer = await prisma.customer.create({
            data: {
              name: record.name,
              email: record.email || '',
              phone: record.phone || '',
              city: record.city || '',
              totalSales: Number(record.totalSales) || 0,
              balance: Number(record.balance) || 0,
              status: record.status || 'active',
            },
          })
          results.push({ success: true, id: customer.id, name: customer.name })
        } else if (type === 'invoices') {
          const last = await prisma.invoice.findFirst({ orderBy: { createdAt: 'desc' } })
          const nextNum = last ? String(Number(last.invoiceNo.replace('INV-', '')) + 1).padStart(4, '0') : '0001'
          const invoice = await prisma.invoice.create({
            data: {
              invoiceNo: `INV-${nextNum}`,
              customerId: record.customerId,
              date: new Date(record.date || Date.now()),
              dueDate: new Date(record.dueDate || Date.now()),
              amount: Number(record.amount) || 0,
              paid: Number(record.paid) || 0,
              status: record.status || 'due',
            },
          })
          results.push({ success: true, id: invoice.id, invoiceNo: invoice.invoiceNo })
        } else if (type === 'credit-notes') {
          const last = await prisma.customerCreditNote.findFirst({ orderBy: { createdAt: 'desc' } })
          const nextNum = last ? String(Number(last.creditNoteNo.replace('CN-', '')) + 1).padStart(4, '0') : '0001'
          const creditNote = await prisma.customerCreditNote.create({
            data: {
              creditNoteNo: `CN-${nextNum}`,
              customerId: record.customerId,
              date: new Date(record.date || Date.now()),
              amount: Number(record.amount) || 0,
              reason: record.reason || '',
              status: record.status || 'draft',
            },
          })
          results.push({ success: true, id: creditNote.id, creditNoteNo: creditNote.creditNoteNo })
        } else {
          results.push({ success: false, error: `Unknown type: ${type}` })
        }
      } catch (err) {
        results.push({ success: false, error: err instanceof Error ? err.message : 'Import error' })
      }
    }
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 })
  }
}
