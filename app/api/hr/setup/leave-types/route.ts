import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.leaveType.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ leaveTypes: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leave types' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name || !body.daysPerYear) {
      return NextResponse.json({ error: 'Name and daysPerYear are required' }, { status: 400 })
    }
    const item = await prisma.leaveType.create({
      data: {
        name: body.name,
        daysPerYear: parseInt(body.daysPerYear),
        isPaid: body.isPaid !== false,
        carryForward: body.carryForward === true,
      },
    })
    return NextResponse.json({ leaveType: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create leave type' }, { status: 500 })
  }
}
