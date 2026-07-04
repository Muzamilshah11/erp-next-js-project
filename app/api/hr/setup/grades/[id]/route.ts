import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const item = await prisma.grade.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ grade: item })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch grade' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const item = await prisma.grade.update({
      where: { id },
      data: {
        name: body.name,
        basicSalary: parseFloat(body.basicSalary),
        houseRentPercent: parseFloat(body.houseRentPercent),
        medicalPercent: parseFloat(body.medicalPercent),
        transportPercent: parseFloat(body.transportPercent),
        status: body.status,
      },
    })
    return NextResponse.json({ grade: item })
  } catch {
    return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await prisma.grade.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 })
  }
}
