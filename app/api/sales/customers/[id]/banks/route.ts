import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const banks = await prisma.customerBank.findMany({ where: { customerId: id }, orderBy: { isDefault: 'desc' } })
    return NextResponse.json({ banks })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    if (!body.bankName || !body.accountTitle || !body.accountNumber) {
      return NextResponse.json({ error: 'Bank name, account title, and account number are required' }, { status: 400 })
    }
    const bank = await prisma.customerBank.create({ data: { customerId: id, bankName: body.bankName, branchName: body.branchName, accountTitle: body.accountTitle, accountNumber: body.accountNumber, iban: body.iban, swiftCode: body.swiftCode, isDefault: body.isDefault ?? false } })
    return NextResponse.json({ bank })
  } catch {
    return NextResponse.json({ error: 'Failed to create bank' }, { status: 500 })
  }
}
