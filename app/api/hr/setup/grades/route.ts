import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await prisma.grade.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ grades: items })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const item = await prisma.grade.create({
      data: {
        name: body.name,
        basicSalary: parseFloat(body.basicSalary) || 0,
        houseRentPercent: parseFloat(body.houseRentPercent) || 0,
        medicalPercent: parseFloat(body.medicalPercent) || 0,
        transportPercent: parseFloat(body.transportPercent) || 0,
      },
    })
    return NextResponse.json({ grade: item })
  } catch {
    return NextResponse.json({ error: 'Failed to create grade' }, { status: 500 })
  }
}
