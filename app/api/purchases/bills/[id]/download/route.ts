import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: { supplier: true, items: true },
    })
    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const curr = (v: number) =>
      new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(v)

    const statusColor: Record<string, string> = { draft: '#6b7280', due: '#2563eb', paid: '#16a34a', overdue: '#dc2626' }

    const itemsHtml = bill.items.map((item, i) =>
      `<tr${i % 2 === 1 ? ' class="alt"' : ''}><td>${item.description}</td><td class="center">${item.quantity}</td><td class="right">${curr(item.price)}</td><td class="right">${curr(item.quantity * item.price)}</td></tr>`
    ).join('')

    const balance = bill.amount - bill.paid

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bill ${bill.billNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f3f4f6; padding: 40px; color: #111827; }
    .wrap { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 48px; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
    .brand h1 { font-size: 24px; color: #2563eb; }
    .brand p { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #fff; background: ${statusColor[bill.status] || '#6b7280'}; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .info-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; }
    .info-block p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; padding: 10px 12px; border-bottom: 2px solid #e5e7eb; }
    th.right, td.right { text-align: right; }
    th.center, td.center { text-align: center; }
    td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
    tr.alt td { background: #f9fafb; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 12px; font-size: 14px; }
    .totals-row.total { border-top: 2px solid #111827; margin-top: 4px; padding-top: 12px; font-weight: 700; font-size: 16px; }
    .totals-row.balance { border-top: 1px solid #e5e7eb; margin-top: 4px; padding-top: 12px; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { background: #fff; padding: 0; } .wrap { box-shadow: none; border-radius: 0; padding: 32px; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="brand"><h1>ERP Pro</h1><p>Enterprise Resource Planning</p></div>
      <div><span class="badge">${bill.status}</span></div>
    </div>
    <div class="info-grid">
      <div class="info-block">
        <h3>From Supplier</h3>
        <p><strong>${bill.supplier.name}</strong><br>${bill.supplier.email}<br>${bill.supplier.phone}${bill.supplier.city ? `<br>${bill.supplier.city}` : ''}</p>
      </div>
      <div class="info-block" style="text-align:right">
        <h3>Bill Details</h3>
        <p><strong>${bill.billNo}</strong><br>Date: ${new Date(bill.date).toLocaleDateString('en-PK')}<br>Due: ${new Date(bill.dueDate).toLocaleDateString('en-PK')}</p>
      </div>
    </div>
    <table>
      <thead><tr><th>Description</th><th class="center">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead>
      <tbody>${itemsHtml || '<tr><td colspan="4" style="text-align:center;color:#9ca3af">No items</td></tr>'}</tbody>
    </table>
    <div class="totals">
      <div class="totals-row total"><span>Total</span><span>${curr(bill.amount)}</span></div>
      ${bill.paid > 0 ? `<div class="totals-row"><span>Paid</span><span>${curr(bill.paid)}</span></div><div class="totals-row balance"><span>Balance Due</span><span>${curr(balance)}</span></div>` : ''}
    </div>
    <div class="footer"><p>ERP Pro — Generated on ${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html', 'Content-Disposition': `attachment; filename="${bill.billNo}.html"` },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to generate bill' }, { status: 500 })
  }
}