import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId
    const items = await prisma.gratuitySettlement.findMany({
      where,
      include: { employee: { select: { id: true, name: true, employeeNo: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    const totalAmount = items.reduce((s, i) => s + i.gratuityAmount, 0)
    return NextResponse.json({ settlements: items, totalAmount, count: items.length })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch gratuity report' }, { status: 500 })
  }
}
