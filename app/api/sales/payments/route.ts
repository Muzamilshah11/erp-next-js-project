import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')?.trim()
    const where: Record<string, unknown> = {}
    if (customerId) where.customerId = customerId
    const payments = await prisma.customerPayment.findMany({
      where,
      include: { customer: { select: { id: true, name: true } }, allocations: { include: { invoice: { select: { id: true, invoiceNo: true, amount: true, paid: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ payments })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const last = await prisma.customerPayment.findFirst({ orderBy: { createdAt: 'desc' } })
    const nextNum = last ? String(Number(last.paymentNo.replace('CP-', '')) + 1).padStart(4, '0') : '0001'
    const paymentNo = `CP-${nextNum}`
    const payment = await prisma.customerPayment.create({
      data: {
        paymentNo,
        customerId: body.customerId,
        date: new Date(body.date),
        amount: body.amount,
        paymentMethod: body.paymentMethod ?? 'cash',
        reference: body.reference,
        status: body.status ?? 'completed',
      },
      include: { customer: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ payment })
  } catch {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
