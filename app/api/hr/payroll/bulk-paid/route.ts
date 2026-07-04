import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const ids: string[] = body.ids || []

    if (!ids.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 })

    const result = await prisma.payroll.updateMany({
      where: { id: { in: ids }, status: 'pending' },
      data: { status: 'paid', paidAt: new Date(), paymentMethod: body.paymentMethod || 'bank-transfer' },
    })

    return NextResponse.json({ count: result.count })
  } catch {
    return NextResponse.json({ error: 'Failed to mark payrolls as paid' }, { status: 500 })
  }
}