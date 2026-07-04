import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  const payroll = await prisma.payroll.findUnique({
    where: { id },
    include: { employee: { select: { name: true, email: true, phone: true, department: true, designation: true, salary: true } } },
  })
  if (!payroll) return new Response('Not found', { status: 404 })

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const monthName = months[payroll.month - 1]

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${payroll.employee.name} - ${monthName} ${payroll.year}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 40px; display: flex; justify-content: center; }
    .payslip { max-width: 800px; width: 100%; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: #fff; padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 28px; font-weight: 700; }
    .header .period { font-size: 14px; opacity: 0.85; margin-top: 4px; }
    .header .status { padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; background: ${payroll.status === 'paid' ? '#16a34a' : '#f59e0b'}; }
    .body { padding: 32px 40px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 16px; font-weight: 600; color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f3f4f6; }
    .field .label { color: #6b7280; font-size: 14px; }
    .field .value { font-weight: 600; color: #111827; font-size: 14px; }
    .total-row { background: #f0fdf4; padding: 12px; border-radius: 8px; margin-top: 8px; }
    .total-row .field { border: none; }
    .total-row .value { font-size: 18px; color: #16a34a; }
    .net-pay { background: #1e40af; color: #fff; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
    .net-pay .label { font-size: 16px; opacity: 0.9; }
    .net-pay .value { font-size: 28px; font-weight: 700; }
    .footer { padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
    .no-print { text-align: center; margin-bottom: 12px; }
    .no-print button { padding: 10px 24px; background: #1e40af; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
    .no-print button:hover { background: #1e3a8a; }
    @media print { .no-print { display: none; } body { padding: 0; background: #fff; } .payslip { box-shadow: none; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="payslip">
    <div class="no-print"><button onclick="window.print()">Print / Save PDF</button></div>
    <div class="header">
      <div><h1>PAYSLIP</h1><div class="period">${monthName} ${payroll.year}</div></div>
      <div class="status">${payroll.status}</div>
    </div>
    <div class="body">
      <div class="section">
        <h2>Employee Details</h2>
        <div class="grid-2">
          <div class="field"><span class="label">Name</span><span class="value">${payroll.employee.name}</span></div>
          <div class="field"><span class="label">Email</span><span class="value">${payroll.employee.email}</span></div>
          <div class="field"><span class="label">Department</span><span class="value">${payroll.employee.department}</span></div>
          <div class="field"><span class="label">Designation</span><span class="value">${payroll.employee.designation}</span></div>
        </div>
      </div>
      <div class="section">
        <h2>Earnings</h2>
        <div class="field"><span class="label">Basic Salary</span><span class="value">${payroll.basicSalary.toLocaleString()}</span></div>
        <div class="field"><span class="label">Total Allowances</span><span class="value">${payroll.totalAllowances.toLocaleString()}</span></div>
        <div class="total-row"><div class="field"><span class="label">Gross Pay</span><span class="value">${payroll.grossPay.toLocaleString()}</span></div></div>
      </div>
      <div class="section">
        <h2>Deductions</h2>
        <div class="field"><span class="label">Total Deductions</span><span class="value">-${payroll.totalDeductions.toLocaleString()}</span></div>
      </div>
      <div class="net-pay">
        <div><div class="label">Net Pay</div></div>
        <div class="value">${payroll.netPay.toLocaleString()}</div>
      </div>
      ${payroll.remarks ? `<div class="section" style="margin-top:16px"><div class="field"><span class="label">Remarks</span><span class="value">${payroll.remarks}</span></div></div>` : ''}
    </div>
    <div class="footer">This is a computer-generated payslip. Powered by ERP System</div>
  </div>
</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}