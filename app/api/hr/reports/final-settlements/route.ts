import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.finalSettlement.findMany({
      include: { employee: { select: { id: true, name: true, employeeNo: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    const totalAmount = items.reduce((s, i) => s + i.netAmount, 0)
    return NextResponse.json({ settlements: items, totalAmount, count: items.length })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch final settlement report' }, { status: 500 })
  }
}
