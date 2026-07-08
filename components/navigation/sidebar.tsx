'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Briefcase,
  Building2,
  DollarSign,
  Headphones,
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ChevronDown,
  LogOut,
  Calendar,
  Clock,
  Wallet,
  Calculator,
  FileText,
  ClipboardList,
  TrendingUp,
  ImageIcon,
  Wrench,
  X,
  Menu,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

interface NavItemProps {
  href?: string
  label: string
  icon: React.ReactNode
  active?: boolean
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
  children?: React.ReactNode
}

function NavItem({
  href,
  label,
  icon,
  active,
  expandable,
  expanded,
  onToggle,
  children,
}: NavItemProps) {
  const content = (
    <>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex items-center justify-center w-4 h-4 transition-colors',
            active ? 'text-primary' : 'text-muted-foreground'
          )}>
            {icon}
          </div>
          <span className={cn(
            'text-xs font-medium transition-colors',
            active ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {label}
          </span>
        </div>
        {expandable && (
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-300',
              expanded ? 'rotate-180' : '',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        )}
      </div>
      {active && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
          initial={false}
          transition={{ duration: 0.3 }}
        />
      )}
    </>
  )

  if (expandable) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          'relative w-full px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between',
          expanded ? 'bg-sidebar-accent text-foreground' : 'hover:bg-sidebar-accent text-muted-foreground'
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={href || '#'}
      className={cn(
        'relative block px-3 py-1.5 rounded-lg transition-colors',
        active
          ? 'bg-sidebar-accent text-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
      )}
    >
      {content}
    </Link>
  )
}

export function Sidebar() {
  const { logout } = useAuth()
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [company, setCompany] = useState<{ companyName?: string; logoUrl?: string } | null>(null)

  useEffect(() => {
    setShow(false)
  }, [pathname])

  useEffect(() => {
    setMounted(true)
    setIsDesktop(window.innerWidth >= 768)
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    fetch('/api/setup/company')
      .then(r => r.json())
      .then(d => setCompany(d.company))
      .catch(() => {})
  }, [])

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    finance: false,
    sales: false,
    purchases: false,
    inventory: false,
    hr: false,
    manufacturing: false,
    'fixed-assets': false,
    crm: false,
    setup: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const isActive = (path: string) => pathname.startsWith(path)

  const modules = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="w-4 h-4" />,
    },
    {
      label: 'Finance',
      expandable: true,
      section: 'finance',
      icon: <DollarSign className="w-4 h-4" />,
      children: [
        { label: 'Chart of Accounts', href: '/finance/chart-of-accounts' },
        { label: 'Journal Entries', href: '/finance/journal-entries' },
        { label: 'Vouchers', href: '/finance/vouchers' },
        { label: 'General Ledger', href: '/finance/ledger' },
        { label: 'Bank Reconciliation', href: '/finance/bank-reconciliation' },
        { label: 'Outstanding Cheques', href: '/finance/outstanding-cheques' },
        { label: 'Budgets', href: '/finance/budgets' },
        { label: 'Reports', href: '/finance/reports' },
      ]
    },
    {
      label: 'Sales',
      expandable: true,
      section: 'sales',
      icon: <ShoppingCart className="w-4 h-4" />,
      children: [
        { label: 'Customers', href: '/sales/customers' },
        { label: 'Quotations', href: '/sales/quotations' },
        { label: 'Orders', href: '/sales/orders' },
        { label: 'Invoices', href: '/sales/invoices' },
        { label: 'Delivery Notes', href: '/sales/delivery-notes' },
        { label: 'Credit Notes', href: '/sales/credit-notes' },
        { label: 'Payments', href: '/sales/payments' },
        { label: 'Allocations', href: '/sales/allocations' },
        { label: 'Persons & Groups', href: '/sales/persons-groups' },
        { label: 'Import', href: '/sales/import' },
      ]
    },
    {
      label: 'Purchases',
      expandable: true,
      section: 'purchases',
      icon: <Briefcase className="w-4 h-4" />,
      children: [
        { label: 'Suppliers', href: '/purchases/suppliers' },
        { label: 'Purchase Orders', href: '/purchases/orders' },
        { label: 'Outstanding POs', href: '/purchases/outstanding' },
        { label: 'GRN', href: '/purchases/grn' },
        { label: 'Bills', href: '/purchases/bills' },
        { label: 'Credit Notes', href: '/purchases/credit-notes' },
        { label: 'Payments', href: '/purchases/payments' },
        { label: 'Allocations', href: '/purchases/allocations' },
        { label: 'Import', href: '/purchases/import' },
      ]
    },
    {
      label: 'Inventory',
      expandable: true,
      section: 'inventory',
      icon: <Package className="w-4 h-4" />,
      children: [
        { label: 'Items', href: '/inventory/items' },
        { label: 'Warehouses', href: '/inventory/warehouses' },
        { label: 'Stock Transfers', href: '/inventory/transfers' },
        { label: 'Adjustments', href: '/inventory/adjustments' },
      ]
    },
    {
      label: 'Fixed Assets',
      expandable: true,
      section: 'fixed-assets',
      icon: <Building2 className="w-4 h-4" />,
      children: [
        { label: 'Categories', href: '/fixed-assets/categories' },
        { label: 'Classes', href: '/fixed-assets/classes' },
        { label: 'Assets', href: '/fixed-assets/assets' },
        { label: 'Transactions', href: '/fixed-assets/transactions' },
        { label: 'Depreciation', href: '/fixed-assets/depreciation' },
        { label: 'Inquiries', href: '/fixed-assets/inquiries' },
      ]
    },
    {
      label: 'CRM',
      expandable: true,
      section: 'crm',
      icon: <Headphones className="w-4 h-4" />,
      children: [
        { label: 'Setup', href: '/crm/setup/ticket-status' },
        { label: 'Tickets', href: '/crm/tickets' },
        { label: 'Tasks', href: '/crm/tasks' },
        { label: 'Calls', href: '/crm/calls' },
        { label: 'Queries', href: '/crm/queries' },
        { label: 'Knowledge Base', href: '/crm/knowledge-base/articles' },
        { label: 'Inquiries', href: '/crm/inquiries' },
      ]
    },
    {
      label: 'HR',
      expandable: true,
      section: 'hr',
      icon: <Users className="w-4 h-4" />,
      children: [
        { label: 'Employees', href: '/hr' },
        { label: 'Payroll', href: '/hr/payroll' },
        { label: 'Setup', href: '/hr/setup' },
        { label: 'Attendance', href: '/hr/attendance' },
        { label: 'Leaves', href: '/hr/leaves' },
        { label: 'Loans', href: '/hr/loans' },
        { label: 'Overtime', href: '/hr/overtime' },
        { label: 'Increments', href: '/hr/increments' },
        { label: 'Gratuity', href: '/hr/gratuity' },
        { label: 'Final Settlement', href: '/hr/final-settlement' },
        { label: 'Reports', href: '/hr/reports' },
      ]
    },
    {
      label: 'Manufacturing',
      expandable: true,
      section: 'manufacturing',
      icon: <Settings className="w-4 h-4" />,
      children: [
        { label: 'BOM', href: '/manufacturing/bom' },
        { label: 'Work Centers', href: '/manufacturing/work-centers' },
        { label: 'Work Orders', href: '/manufacturing/orders' },
        { label: 'Inquiries', href: '/manufacturing/inquiries' },
      ]
    },
    {
      label: 'Setup & Maintenance',
      expandable: true,
      section: 'setup',
      icon: <Wrench className="w-4 h-4" />,
      children: [
        { label: 'Company Setup', href: '/settings/company' },
        { label: 'Display Setup', href: '/settings/display' },
        { label: 'Tax Rates', href: '/settings/tax-rates' },
        { label: 'Fiscal Years', href: '/settings/fiscal-years' },
        { label: 'CSV Templates', href: '/settings/csv-templates' },
        { label: 'Void Transaction', href: '/settings/void-transaction' },
        { label: 'Reports Hub', href: '/reports' },
      ]
    },
  ]

  const sidebarContent = (
    <>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.companyName || 'Company'}
              style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', background: '#1e293b' }} />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sidebar-foreground)' }}>{company?.companyName || 'ERP Pro'}</div>
            <div style={{ fontSize: '12px', color: 'var(--sidebar-muted, var(--muted-foreground))' }}>{company ? 'v1.0' : 'Loading...'}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {modules.map((module) => (
          <div key={module.label}>
            {module.expandable ? (
              <>
                <NavItem
                  label={module.label}
                  icon={module.icon}
                  expandable
                  expanded={expandedSections[module.section!]}
                  onToggle={() => toggleSection(module.section!)}
                  active={isActive(`/${module.section}`)}
                />
                {expandedSections[module.section!] && (
                  <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    {module.children?.map(child => (
                      <NavItem
                        key={child.href}
                        href={child.href}
                        label={child.label}
                        icon={<div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />}
                        active={pathname === child.href}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavItem
                href={module.href}
                label={module.label}
                icon={module.icon}
                active={pathname === module.href}
              />
            )}
          </div>
        ))}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <NavItem
          href="/settings"
          label="Settings"
          icon={<Settings className="w-4 h-4" />}
          active={pathname === '/settings'}
        />
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            color: 'var(--muted-foreground)', background: 'transparent', fontSize: '12px', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '10px',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--sidebar-accent)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent' }}
        >
          <LogOut style={{ width: '14px', height: '14px' }} />
          <span>Logout</span>
        </button>
      </div>
    </>
  )

  if (!mounted) return null

  const visible = isDesktop || show

  return (
    <>
      {!isDesktop && (
        <button
          onClick={() => setShow(true)}
          style={{
            position: 'fixed', top: 16, left: 16, zIndex: 9999,
            padding: 8, background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--muted-foreground)', borderRadius: 8,
          }}
        >
          <Menu size={20} />
        </button>
      )}

      {show && !isDesktop && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40,
          }}
          onClick={() => setShow(false)}
        />
      )}

      <aside
        style={{
          width: isDesktop ? 256 : 256,
          height: '100vh',
          display: visible ? 'flex' : 'none',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto',
          backgroundColor: 'var(--sidebar)',
          color: 'var(--sidebar-foreground)',
          borderRight: '1px solid var(--sidebar-border)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          position: isDesktop ? 'static' : ('fixed' as const),
          top: 0,
          left: 0,
          zIndex: isDesktop ? 0 : 50,
        }}
      >
        {!isDesktop && (
          <button
            onClick={() => setShow(false)}
            style={{
              position: 'absolute', top: 20, right: 16, padding: 4, border: 'none',
              cursor: 'pointer', color: 'var(--muted-foreground)', background: 'transparent', borderRadius: 8,
            }}
          >
            <X size={20} />
          </button>
        )}
        {sidebarContent}
      </aside>
    </>
  )
}
