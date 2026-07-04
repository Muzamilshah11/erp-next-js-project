import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const entry = await prisma.journalEntry.findUnique({ where: { id } })
    if (!entry) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    if (!entry.isCheque) return NextResponse.json({ error: 'Not a cheque voucher' }, { status: 400 })
    if (entry.isCleared) return NextResponse.json({ error: 'Cheque already cleared' }, { status: 400 })

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: { isCleared: true, clearedDate: body.clearedDate ? new Date(body.clearedDate) : new Date() },
      include: { lines: { include: { account: true } } },
    })
    return NextResponse.json({ entry: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to clear cheque' }, { status: 500 })
  }
}
