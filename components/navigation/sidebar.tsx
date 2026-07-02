'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Briefcase,
  DollarSign,
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    finance: true,
    sales: false,
    purchases: false,
    inventory: false,
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
        { label: 'General Ledger', href: '/finance/ledger' },
        { label: 'Bank Reconciliation', href: '/finance/bank-reconciliation' },
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
        { label: 'GRN', href: '/purchases/grn' },
        { label: 'Bills', href: '/purchases/bills' },
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
      label: 'HR',
      href: '/hr',
      icon: <Users className="w-4 h-4" />,
    },
  ]

  return (
    <motion.aside
      className="w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col overflow-y-auto shadow-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">ERP Pro</h1>
            <p className="text-xs text-muted-foreground">v1.0</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="space-y-1"
        >
          {modules.map((module, idx) => (
            <motion.div
              key={module.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.3 }}
            >
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
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pl-5 space-y-0.5 mt-0.5"
                    >
                      {module.children?.map(child => (
                        <motion.div
                          key={child.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <NavItem
                            href={child.href}
                            label={child.label}
                            icon={<div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            active={pathname === child.href}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
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
            </motion.div>
          ))}
        </motion.div>
      </nav>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="p-3 border-t border-black/10 dark:border-black/20 space-y-1.5"
      >
        <NavItem
          href="/settings"
          label="Settings"
          icon={<Settings className="w-4 h-4" />}
          active={pathname === '/settings'}
        />
        <button
          onClick={logout}
          className="w-full px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent flex items-center gap-2.5 transition-colors text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </motion.div>
    </motion.aside>
  )
}
