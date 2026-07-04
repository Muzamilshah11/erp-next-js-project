import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const creditNote = await prisma.customerCreditNote.findUnique({ where: { id }, include: { items: true } })
    if (!creditNote) return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    if (creditNote.status !== 'draft') return NextResponse.json({ error: 'Only draft credit notes can be issued' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      for (const item of creditNote.items) {
        if (item.itemId && item.warehouseId) {
          await tx.inventoryItem.update({
            where: { id: item.itemId },
            data: { quantity: { increment: item.quantity } },
          })
        }
      }
      await tx.customerCreditNote.update({ where: { id }, data: { status: 'issued' } })
    })
    return NextResponse.json({ success: true, creditNoteId: id })
  } catch {
    return NextResponse.json({ error: 'Failed to issue credit note' }, { status: 500 })
  }
}
