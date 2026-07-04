import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const item = await prisma.taxSlab.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ taxSlab: item })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tax slab' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const item = await prisma.taxSlab.update({
      where: { id },
      data: {
        fiscalYear: body.fiscalYear,
        minIncome: parseFloat(body.minIncome),
        maxIncome: body.maxIncome ? parseFloat(body.maxIncome) : null,
        rate: parseFloat(body.rate),
        fixedAmount: parseFloat(body.fixedAmount),
      },
    })
    return NextResponse.json({ taxSlab: item })
  } catch {
    return NextResponse.json({ error: 'Failed to update tax slab' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.taxSlab.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete tax slab' }, { status: 500 })
  }
}
