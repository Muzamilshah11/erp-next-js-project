import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.attendancePolicy.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ policies: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const item = await prisma.attendancePolicy.create({
      data: {
        name: body.name,
        workingDaysPerWeek: parseInt(body.workingDaysPerWeek) || 6,
        hoursPerDay: parseFloat(body.hoursPerDay) || 9,
        lateThreshold: parseInt(body.lateThreshold) || 15,
        earlyThreshold: parseInt(body.earlyThreshold) || 15,
        overtimeRate: parseFloat(body.overtimeRate) || 1.5,
      },
    })
    return NextResponse.json({ policy: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 })
  }
}
