import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.glMapping.findMany({
      include: { debitAccount: true, creditAccount: true },
      orderBy: { module: 'asc' },
    })
    return NextResponse.json({ mappings: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch GL mappings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.module || !body.debitAccountId || !body.creditAccountId) {
      return NextResponse.json({ error: 'module, debitAccountId, and creditAccountId are required' }, { status: 400 })
    }
    const item = await prisma.glMapping.create({
      data: { module: body.module, debitAccountId: body.debitAccountId, creditAccountId: body.creditAccountId, description: body.description },
      include: { debitAccount: true, creditAccount: true },
    })
    return NextResponse.json({ mapping: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create GL mapping' }, { status: 500 })
  }
}
