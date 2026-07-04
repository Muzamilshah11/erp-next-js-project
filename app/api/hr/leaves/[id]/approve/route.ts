import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    if (!body.status || !['approved', 'rejected'].includes(body.status)) {
      return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
    }
    const item = await prisma.leaveApplication.update({
      where: { id },
      data: { status: body.status, approvedById: user.id, approvedAt: new Date() },
      include: { employee: { select: { id: true, name: true } }, leaveType: true },
    })
    return NextResponse.json({ leave: item })
  } catch {
    return NextResponse.json({ error: 'Failed to update leave status' }, { status: 500 })
  }
}
