import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const item = await prisma.glMapping.findUnique({ where: { id }, include: { debitAccount: true, creditAccount: true } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ mapping: item })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch GL mapping' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const item = await prisma.glMapping.update({
      where: { id },
      data: { module: body.module, debitAccountId: body.debitAccountId, creditAccountId: body.creditAccountId, description: body.description },
      include: { debitAccount: true, creditAccount: true },
    })
    return NextResponse.json({ mapping: item })
  } catch {
    return NextResponse.json({ error: 'Failed to update GL mapping' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.glMapping.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete GL mapping' }, { status: 500 })
  }
}
