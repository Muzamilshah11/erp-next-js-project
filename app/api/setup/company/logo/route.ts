import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `logo.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'company')
    await mkdir(uploadDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadDir, fileName), buffer)
    const logoUrl = `/uploads/company/${fileName}`
    const { prisma } = await import('@/lib/prisma')
    const existing = await prisma.company.findFirst()
    if (existing) await prisma.company.update({ where: { id: existing.id }, data: { logoUrl } })
    else await prisma.company.create({ data: { companyName: '', logoUrl } })
    return NextResponse.json({ logoUrl })
  } catch {
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}
