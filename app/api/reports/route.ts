import { NextResponse } from 'next/server'

const reportCategories = [
  {
    category: 'Financial Reports',
    icon: 'DollarSign',
    reports: [
      { label: 'Trial Balance', href: '/finance/reports' },
      { label: 'Income Statement', href: '/finance/reports' },
      { label: 'Balance Sheet', href: '/finance/reports' },
      { label: 'General Ledger', href: '/finance/ledger' },
      { label: 'Chart of Accounts', href: '/finance/chart-of-accounts' },
    ],
  },
  {
    category: 'Sales Reports',
    icon: 'ShoppingCart',
    reports: [
      { label: 'Invoices', href: '/sales/invoices' },
      { label: 'Quotations', href: '/sales/quotations' },
      { label: 'Sales Orders', href: '/sales/orders' },
      { label: 'Delivery Notes', href: '/sales/delivery-notes' },
      { label: 'Credit Notes', href: '/sales/credit-notes' },
      { label: 'Customer Payments', href: '/sales/payments' },
    ],
  },
  {
    category: 'Purchase Reports',
    icon: 'Package',
    reports: [
      { label: 'Bills', href: '/purchases/bills' },
      { label: 'Purchase Orders', href: '/purchases/orders' },
      { label: 'GRN', href: '/purchases/grn' },
      { label: 'Supplier Payments', href: '/purchases/payments' },
      { label: 'Credit Notes', href: '/purchases/credit-notes' },
    ],
  },
  {
    category: 'Inventory Reports',
    icon: 'ClipboardList',
    reports: [
      { label: 'Items', href: '/inventory/items' },
      { label: 'Warehouses', href: '/inventory/warehouses' },
      { label: 'Stock Transfers', href: '/inventory/transfers' },
      { label: 'Stock Adjustments', href: '/inventory/adjustments' },
    ],
  },
  {
    category: 'Fixed Assets',
    icon: 'Briefcase',
    reports: [
      { label: 'Assets', href: '/fixed-assets/assets' },
      { label: 'Categories', href: '/fixed-assets/categories' },
      { label: 'Depreciation', href: '/fixed-assets/depreciation' },
      { label: 'Inquiries', href: '/fixed-assets/inquiries' },
    ],
  },
  {
    category: 'Banking',
    icon: 'Building2',
    reports: [
      { label: 'Bank Reconciliation', href: '/finance/bank-reconciliation' },
      { label: 'Outstanding Cheques', href: '/finance/outstanding-cheques' },
      { label: 'Vouchers', href: '/finance/vouchers' },
    ],
  },
  {
    category: 'HR Reports',
    icon: 'Users',
    reports: [
      { label: 'Employees', href: '/hr' },
      { label: 'Payroll', href: '/hr/payroll' },
      { label: 'Attendance', href: '/hr/attendance' },
      { label: 'Leaves', href: '/hr/leaves' },
      { label: 'Loans', href: '/hr/loans' },
      { label: 'HR Reports', href: '/hr/reports' },
    ],
  },
]

export async function GET() {
  return NextResponse.json({ categories: reportCategories })
}
