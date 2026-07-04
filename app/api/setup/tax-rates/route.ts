import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.taxRate.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ taxRates: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tax rates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json()
    if (!body.name || body.rate === undefined) return NextResponse.json({ error: 'Name and rate are required' }, { status: 400 })
    if (body.isDefault) await prisma.taxRate.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    const item = await prisma.taxRate.create({ data: { name: body.name, rate: parseFloat(body.rate), isDefault: body.isDefault === true, applicableTo: body.applicableTo || 'both' } })
    return NextResponse.json({ taxRate: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create tax rate' }, { status: 500 })
  }
}
