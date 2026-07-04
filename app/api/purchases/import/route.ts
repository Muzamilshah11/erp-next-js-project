import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { type, records } = body
    if (!type || !records?.length) return NextResponse.json({ error: 'type and records required' }, { status: 400 })

    const results = []
    for (const record of records) {
      try {
        if (type === 'suppliers') {
          const supplier = await prisma.supplier.create({
            data: {
              name: record.name,
              email: record.email || '',
              phone: record.phone || '',
              city: record.city || '',
              contactPerson: record.contactPerson || '',
              totalPurchases: Number(record.totalPurchases) || 0,
              balance: Number(record.balance) || 0,
              openingBalance: Number(record.openingBalance) || 0,
              status: record.status || 'active',
            },
          })
          results.push({ success: true, id: supplier.id, name: supplier.name })
        } else {
          results.push({ success: false, error: `Unknown type: ${type}` })
        }
      } catch (err) {
        results.push({ success: false, error: err instanceof Error ? err.message : 'Import error' })
      }
    }
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 })
  }
}
