import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (!Array.isArray(body.records) || !body.records.length) {
      return NextResponse.json({ error: 'records array is required' }, { status: 400 })
    }
    const results: { employeeNo: string; date: string; status: string; error?: string }[] = []
    for (const record of body.records) {
      try {
        const emp = await prisma.employee.findFirst({ where: { employeeNo: record.employeeNo } })
        if (!emp) { results.push({ employeeNo: record.employeeNo, date: record.date, status: 'skipped', error: 'Employee not found' }); continue }
        await prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: emp.id, date: new Date(record.date) } },
          update: { timeIn: record.timeIn || null, timeOut: record.timeOut || null, status: record.status || 'present', hoursWorked: parseFloat(record.hoursWorked) || 0, overtimeHours: parseFloat(record.overtimeHours) || 0, source: 'csv' },
          create: { employeeId: emp.id, date: new Date(record.date), timeIn: record.timeIn || null, timeOut: record.timeOut || null, status: record.status || 'present', hoursWorked: parseFloat(record.hoursWorked) || 0, overtimeHours: parseFloat(record.overtimeHours) || 0, source: 'csv' },
        })
        results.push({ employeeNo: record.employeeNo, date: record.date, status: 'imported' })
      } catch (e) {
        results.push({ employeeNo: record.employeeNo, date: record.date, status: 'error', error: String(e) })
      }
    }
    return NextResponse.json({ results, imported: results.filter(r => r.status === 'imported').length, skipped: results.filter(r => r.status === 'skipped').length })
  } catch {
    return NextResponse.json({ error: 'Failed to import attendance' }, { status: 500 })
  }
}
