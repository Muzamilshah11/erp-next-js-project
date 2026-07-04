import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const asset = await prisma.asset.findUnique({
      where: { id }, include: { category: { select: { name: true } }, class: { select: { name: true, usefulLife: true, salvageValue: true } } },
    })
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ asset })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.name) data.name = body.name
    if (body.categoryId) data.categoryId = body.categoryId
    if (body.classId) data.classId = body.classId
    if (body.location !== undefined) data.location = body.location
    if (body.serialNo !== undefined) data.serialNo = body.serialNo
    if (body.purchaseDate) data.purchaseDate = new Date(body.purchaseDate)
    if (body.currentValue !== undefined) data.currentValue = parseFloat(body.currentValue)
    if (body.purchaseCost !== undefined) data.purchaseCost = parseFloat(body.purchaseCost)
    if (body.netBookValue !== undefined) data.netBookValue = parseFloat(body.netBookValue)
    if (body.status) data.status = body.status

    const asset = await prisma.asset.update({ where: { id }, data, include: { category: { select: { name: true } }, class: { select: { name: true } } } })
    return NextResponse.json({ asset })
  } catch {
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; await prisma.asset.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}