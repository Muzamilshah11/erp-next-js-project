import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const records = (await request.json()).records || []
    if (!records.length) return NextResponse.json({ error: 'No records provided' }, { status: 400 })

    const created = []
    for (const r of records) {
      if (!r.type || !r.itemSku || !r.quantity) continue
      const item = await prisma.inventoryItem.findUnique({ where: { sku: r.itemSku } })
      if (!item) continue

      let bom
      if (r.bomNo) {
        bom = await prisma.bOM.findUnique({ where: { bomNo: r.bomNo }, include: { items: true } })
      }
      const wh = r.warehouseCode ? await prisma.warehouse.findUnique({ where: { code: r.warehouseCode } }) : null

      const prefix = r.type === 'assemble' ? 'MO-' : 'MU-'
      const count = await prisma.workOrder.count()

      let orderItems: { itemId: string; quantity: number; type: string }[] = []
      if (r.type === 'assemble' && bom) {
        orderItems = bom.items.map(i => ({ itemId: i.itemId, quantity: i.quantity * (parseInt(r.quantity) || 1), type: 'component' }))
        orderItems.push({ itemId: item.id, quantity: parseInt(r.quantity) || 1, type: 'finished-good' })
      } else {
        orderItems = [{ itemId: item.id, quantity: parseInt(r.quantity) || 1, type: 'finished-good' }]
      }

      const order = await prisma.workOrder.create({
        data: {
          workOrderNo: `${prefix}${String(count + 1).padStart(4, '0')}`,
          type: r.type, itemId: item.id, bomId: bom?.id || null,
          sourceWarehouseId: r.type === 'unassemble' ? wh?.id || null : null,
          destinationWarehouseId: r.type === 'assemble' ? wh?.id || null : null,
          quantity: parseInt(r.quantity) || 1, status: 'draft',
          items: { create: orderItems },
        },
      })
      created.push(order)
    }
    return NextResponse.json({ count: created.length })
  } catch {
    return NextResponse.json({ error: 'Failed to import work orders' }, { status: 500 })
  }
}