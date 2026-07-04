import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const records = body.records || []
    if (!records.length) return NextResponse.json({ error: 'No records provided' }, { status: 400 })

    const created = []
    for (const r of records) {
      if (!r.itemSku || !r.componentSku) continue
      const item = await prisma.inventoryItem.findUnique({ where: { sku: r.itemSku } })
      const component = await prisma.inventoryItem.findUnique({ where: { sku: r.componentSku } })
      if (!item || !component) continue

      let bom = await prisma.bOM.findFirst({ where: { itemId: item.id } })
      if (!bom) {
        const prefix = 'BOM-'; const count = await prisma.bOM.count()
        bom = await prisma.bOM.create({
          data: { bomNo: `${prefix}${String(count + 1).padStart(4, '0')}`, name: `BOM for ${item.name}`, itemId: item.id, quantity: 1, totalCost: 0 },
        })
      }
      const unitCost = component.unitPrice
      await prisma.bOMItem.create({ data: { bomId: bom.id, itemId: component.id, quantity: parseFloat(r.quantity) || 1, unitCost } })
      await prisma.bOM.update({ where: { id: bom.id }, data: { totalCost: { increment: unitCost * (parseFloat(r.quantity) || 1) } } })
      created.push(r)
    }
    return NextResponse.json({ count: created.length })
  } catch {
    return NextResponse.json({ error: 'Failed to import BOM' }, { status: 500 })
  }
}