import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.taxSlab.findMany({ orderBy: [{ fiscalYear: 'desc' }, { minIncome: 'asc' }] })
    return NextResponse.json({ taxSlabs: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tax slabs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.fiscalYear || body.minIncome === undefined) {
      return NextResponse.json({ error: 'fiscalYear and minIncome are required' }, { status: 400 })
    }
    const item = await prisma.taxSlab.create({
      data: {
        fiscalYear: body.fiscalYear,
        minIncome: parseFloat(body.minIncome),
        maxIncome: body.maxIncome ? parseFloat(body.maxIncome) : null,
        rate: parseFloat(body.rate) || 0,
        fixedAmount: parseFloat(body.fixedAmount) || 0,
      },
    })
    return NextResponse.json({ taxSlab: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create tax slab' }, { status: 500 })
  }
}
