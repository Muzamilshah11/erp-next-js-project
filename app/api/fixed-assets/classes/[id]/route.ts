import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const body = await request.json()
    const cls = await prisma.assetClass.update({ where: { id }, data: { name: body.name, description: body.description, usefulLife: body.usefulLife, salvageValue: body.salvageValue, defaultRate: body.defaultRate } })
    return NextResponse.json({ class: cls })
  } catch {
    return NextResponse.json({ error: 'Failed to update asset class' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const cls = await prisma.assetClass.findUnique({ where: { id }, include: { _count: { select: { assets: true } } } })
    if ((cls?._count.assets ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete class with linked assets' }, { status: 400 })
    await prisma.assetClass.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete asset class' }, { status: 500 })
  }
}