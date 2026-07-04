import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const allowances = await prisma.allowance.findMany({ include: { employee: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ allowances })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch allowances' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.employeeId || !body.type || body.amount === undefined) {
      return NextResponse.json({ error: 'employeeId, type, and amount are required' }, { status: 400 })
    }
    const allowance = await prisma.allowance.create({ data: { employeeId: body.employeeId, type: body.type, amount: body.amount } })
    return NextResponse.json({ allowance })
  } catch {
    return NextResponse.json({ error: 'Failed to create allowance' }, { status: 500 })
  }
}