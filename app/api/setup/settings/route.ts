import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] })
    const grouped: Record<string, Record<string, string>> = {}
    for (const s of settings) {
      if (!grouped[s.group]) grouped[s.group] = {}
      grouped[s.group][s.key] = s.value
    }
    return NextResponse.json({ settings, grouped })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json()
    if (!body.key) return NextResponse.json({ error: 'key is required' }, { status: 400 })
    const setting = await prisma.systemSetting.upsert({
      where: { key: body.key },
      update: { value: body.value, group: body.group, type: body.type },
      create: { key: body.key, value: body.value || '', group: body.group || 'general', type: body.type || 'string' },
    })
    return NextResponse.json({ setting })
  } catch {
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
}
