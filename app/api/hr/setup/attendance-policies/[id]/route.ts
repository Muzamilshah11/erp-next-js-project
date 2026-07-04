import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const item = await prisma.attendancePolicy.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ policy: item })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch policy' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const item = await prisma.attendancePolicy.update({
      where: { id },
      data: {
        name: body.name,
        workingDaysPerWeek: parseInt(body.workingDaysPerWeek),
        hoursPerDay: parseFloat(body.hoursPerDay),
        lateThreshold: parseInt(body.lateThreshold),
        earlyThreshold: parseInt(body.earlyThreshold),
        overtimeRate: parseFloat(body.overtimeRate),
        status: body.status,
      },
    })
    return NextResponse.json({ policy: item })
  } catch {
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.attendancePolicy.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 })
  }
}
