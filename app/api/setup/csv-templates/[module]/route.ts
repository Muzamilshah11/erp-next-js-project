import { NextResponse } from 'next/server'

const templates: Record<string, { headers: string[]; sample: string[] }> = {
  items: {
    headers: ['SKU', 'Name', 'Category', 'UnitPrice', 'Quantity', 'ReorderLevel', 'WarehouseCode'],
    sample: ['ITEM-001', 'Office Chair', 'Furniture', '15000', '10', '5', 'WH-01'],
  },
  customers: {
    headers: ['Name', 'Email', 'Phone', 'City', 'Status', 'SalesPersonEmail'],
    sample: ['Ali Ahmed', 'ali@example.com', '03001234567', 'Karachi', 'active', ''],
  },
  suppliers: {
    headers: ['Name', 'Email', 'Phone', 'City', 'ContactPerson', 'Status'],
    sample: ['Tech Supplies Co', 'info@techsupplies.com', '0211234567', 'Lahore', 'Sara Khan', 'active'],
  },
  employees: {
    headers: ['EmployeeNo', 'Name', 'Email', 'Phone', 'DepartmentName', 'DesignationName', 'BasicSalary', 'JoinDate'],
    sample: ['EMP-0001', 'John Doe', 'john@example.com', '03001234567', 'Finance', 'Accountant', '50000', '2024-01-01'],
  },
}

export async function GET(_request: Request, { params }: { params: Promise<{ module: string }> }) {
  try {
    const { module } = await params
    const template = templates[module]
    if (!template) return NextResponse.json({ error: 'Unknown module' }, { status: 404 })
    const headerLine = template.headers.join(',')
    const sampleLine = template.sample.join(',')
    const csv = `${headerLine}\n${sampleLine}\n`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${module}-template.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
