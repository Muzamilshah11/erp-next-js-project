import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const deductions = await prisma.deduction.findMany({ include: { employee: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ deductions })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deductions' }, { status: 500 })
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
    const deduction = await prisma.deduction.create({ data: { employeeId: body.employeeId, type: body.type, amount: body.amount } })
    return NextResponse.json({ deduction })
  } catch {
    return NextResponse.json({ error: 'Failed to create deduction' }, { status: 500 })
  }
}