import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
        { phone: { contains: q, mode: 'insensitive' as const } },
        { city: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {}

    const suppliers = await prisma.supplier.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ suppliers })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    const supplier = await prisma.supplier.create({ data: body })
    return NextResponse.json({ supplier })
  } catch {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}