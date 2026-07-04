import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, items: true },
    })
    if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ quotation })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        customerId: body.customerId,
        date: body.date ? new Date(body.date) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        amount: body.amount,
        status: body.status,
      },
      include: { customer: true, items: true },
    })
    return NextResponse.json({ quotation })
  } catch {
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.quotation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 })
  }
}