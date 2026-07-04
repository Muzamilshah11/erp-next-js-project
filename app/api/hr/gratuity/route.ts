import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.gratuitySettlement.findMany({
      include: { employee: { select: { id: true, name: true, employeeNo: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ settlements: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch gratuity settlements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || !body.settlementDate || body.gratuityAmount === undefined) {
      return NextResponse.json({ error: 'employeeId, settlementDate, and gratuityAmount are required' }, { status: 400 })
    }
    const item = await prisma.gratuitySettlement.create({
      data: {
        employeeId: body.employeeId,
        settlementDate: new Date(body.settlementDate),
        totalYears: parseFloat(body.totalYears) || 0,
        gratuityAmount: parseFloat(body.gratuityAmount),
        status: 'settled',
      },
      include: { employee: { select: { id: true, name: true, employeeNo: true } } },
    })
    return NextResponse.json({ settlement: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create gratuity settlement' }, { status: 500 })
  }
}
