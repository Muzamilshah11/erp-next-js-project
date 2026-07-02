import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await request.json()
    const transaction = await prisma.bankTransaction.update({
      where: { id },
      data: { reconciled: body.reconciled },
    })
    return NextResponse.json({ transaction })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reconciliation status' }, { status: 500 })
  }
}
