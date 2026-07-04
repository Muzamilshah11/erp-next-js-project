'use client'

import { motion } from 'framer-motion'
import { Building2, Monitor, Percent, Download, RotateCcw, FileText, Calendar } from 'lucide-react'

const cards = [
  { label: 'Company Setup', desc: 'Company name, logo, tax reg, financial year', icon: <Building2 className="w-6 h-6" />, href: '/settings/company', color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200' },
  { label: 'Display Setup', desc: 'Date format, currency position, preferences', icon: <Monitor className="w-6 h-6" />, href: '/settings/display', color: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200' },
  { label: 'Tax Rates', desc: 'Define GST, sales tax, and other tax rates', icon: <Percent className="w-6 h-6" />, href: '/settings/tax-rates', color: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200' },
  { label: 'Fiscal Years', desc: 'Manage financial year periods', icon: <Calendar className="w-6 h-6" />, href: '/settings/fiscal-years', color: 'from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200' },
  { label: 'CSV Templates', desc: 'Download import templates for Items, Customers, Suppliers', icon: <Download className="w-6 h-6" />, href: '/settings/csv-templates', color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200' },
  { label: 'Void Transaction', desc: 'Reverse posted invoices, bills, and journal entries', icon: <RotateCcw className="w-6 h-6" />, href: '/settings/void-transaction', color: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200' },
  { label: 'Reports Hub', desc: 'All reports in one place', icon: <FileText className="w-6 h-6" />, href: '/reports', color: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200' },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Setup & Maintenance</h1>
        <p className="text-muted-foreground mt-1">Configure your system, manage tax rates, void transactions, and download CSV templates</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <Link key={i} href={card.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-gradient-to-br ${card.color} rounded-xl p-5 border cursor-pointer hover:shadow-lg transition-shadow`}
              whileHover={{ y: -3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{card.label}</h3>
                <span className="text-muted-foreground/70">{card.icon}</span>
              </div>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}
