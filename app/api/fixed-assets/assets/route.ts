import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const categoryId = searchParams.get('categoryId'); const classId = searchParams.get('classId'); const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (categoryId) where.categoryId = categoryId
    if (classId) where.classId = classId
    if (status) where.status = status
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { assetNo: { contains: q, mode: 'insensitive' } },
      { serialNo: { contains: q, mode: 'insensitive' } },
    ]

    const assets = await prisma.asset.findMany({
      where, include: { category: { select: { id: true, name: true } }, class: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ assets })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name || !body.categoryId || !body.classId || !body.purchaseDate || !body.purchaseCost) {
      return NextResponse.json({ error: 'Name, category, class, purchase date, and cost are required' }, { status: 400 })
    }

    const prefix = 'AST-'; const count = await prisma.asset.count(); const assetNo = `${prefix}${String(count + 1).padStart(4, '0')}`
    const purchaseCost = parseFloat(body.purchaseCost)
    const currentValue = body.currentValue !== undefined ? parseFloat(body.currentValue) : purchaseCost

    // Check for GL accounts
    let assetAccount = await prisma.account.findFirst({ where: { code: '1500' } })
    let cashAccount = await prisma.account.findFirst({ where: { code: '1000' } })

    let journalEntryId: string | null = null

    if (assetAccount && cashAccount) {
      const jeCount = await prisma.journalEntry.count()
      const entryNo = `JE-${new Date().getFullYear()}-${String(jeCount + 1).padStart(6, '0')}`
      const je = await prisma.journalEntry.create({
        data: {
          entryNo, date: new Date(body.purchaseDate), description: `Asset Purchase: ${body.name}`,
          totalDebit: purchaseCost, totalCredit: purchaseCost, status: 'posted',
          lines: { create: [{ accountId: assetAccount.id, debit: purchaseCost, credit: 0 }, { accountId: cashAccount.id, debit: 0, credit: purchaseCost }] },
        },
      })
      journalEntryId = je.id
    }

    const asset = await prisma.asset.create({
      data: {
        assetNo, name: body.name, categoryId: body.categoryId, classId: body.classId,
        purchaseDate: new Date(body.purchaseDate), purchaseCost, currentValue,
        netBookValue: currentValue, location: body.location || null, serialNo: body.serialNo || null,
      },
      include: { category: { select: { name: true } }, class: { select: { name: true } } },
    })

    // Create purchase transaction
    await prisma.assetTransaction.create({
      data: { assetId: asset.id, type: 'purchase', date: new Date(body.purchaseDate), description: 'Initial acquisition', amount: purchaseCost, journalEntryId },
    })

    return NextResponse.json({ asset })
  } catch {
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}