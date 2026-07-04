import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { key } = await params; const body = await request.json()
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: body.value },
      create: { key, value: body.value || '', group: body.group || 'display', type: body.type || 'string' },
    })
    return NextResponse.json({ setting })
  } catch {
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { key } = await params; await prisma.systemSetting.delete({ where: { key } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
  }
}
