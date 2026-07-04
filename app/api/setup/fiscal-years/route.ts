import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.fiscalYear.findMany({ orderBy: { startDate: 'desc' } })
    return NextResponse.json({ fiscalYears: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch fiscal years' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json()
    if (!body.name || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'name, startDate, endDate are required' }, { status: 400 })
    }
    if (body.isActive) await prisma.fiscalYear.updateMany({ where: { isActive: true }, data: { isActive: false } })
    const item = await prisma.fiscalYear.create({ data: { name: body.name, startDate: new Date(body.startDate), endDate: new Date(body.endDate), isActive: body.isActive === true } })
    return NextResponse.json({ fiscalYear: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create fiscal year' }, { status: 500 })
  }
}
