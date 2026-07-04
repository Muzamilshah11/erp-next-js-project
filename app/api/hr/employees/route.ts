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
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
      ],
    } : {}

    const employees = await prisma.employee.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ employees })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body.name || !body.email || !body.department || !body.designation) {
      return NextResponse.json({ error: 'Name, email, department, and designation are required' }, { status: 400 })
    }
    const employee = await prisma.employee.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        designation: body.designation,
        department: body.department,
        salary: body.salary || 0,
        joinDate: body.joinDate ? new Date(body.joinDate) : new Date(),
        status: body.status || 'active',
      },
    })
    return NextResponse.json({ employee })
  } catch {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}