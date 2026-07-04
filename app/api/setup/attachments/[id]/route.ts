import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const attachment = await prisma.documentAttachment.findUnique({ where: { id } })
    if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const filePath = path.join(process.cwd(), 'public', attachment.filePath)
    const fs = await import('fs/promises')
    const fileBuffer = await fs.readFile(filePath)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${attachment.fileName}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const attachment = await prisma.documentAttachment.findUnique({ where: { id } })
    if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const filePath = path.join(process.cwd(), 'public', attachment.filePath)
    try { await unlink(filePath) } catch {}
    await prisma.documentAttachment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
  }
}
