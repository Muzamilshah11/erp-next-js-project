'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Loader2, DollarSign, ShoppingCart, Package, ClipboardList, Briefcase, Building2, Users, FileText } from 'lucide-react'
import Link from 'next/link'

const iconMap: Record<string, React.ReactNode> = {
  DollarSign: <DollarSign className="w-6 h-6" />,
  ShoppingCart: <ShoppingCart className="w-6 h-6" />,
  Package: <Package className="w-6 h-6" />,
  ClipboardList: <ClipboardList className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />,
}

const colorClasses = [
  'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30',
  'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30',
  'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/30',
  'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30',
  'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800/30',
  'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800/30',
  'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800/30',
]

interface ReportCategory { category: string; icon: string; reports: { label: string; href: string }[] }

export default function ReportsPage() {
  const [categories, setCategories] = useState<ReportCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><FileText className="w-8 h-8 text-primary" /> Reports Hub</h1>
        <p className="text-muted-foreground mt-1">All reports across all modules in one central location</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((cat, i) => (
          <motion.div key={cat.category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-gradient-to-br ${colorClasses[i % colorClasses.length]} rounded-xl p-5 border`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-muted-foreground/70">{iconMap[cat.icon] || <FileText className="w-6 h-6" />}</span>
              <h2 className="text-lg font-bold text-foreground">{cat.category}</h2>
            </div>
            <div className="space-y-1">
              {cat.reports.map((r, j) => (
                <Link key={j} href={r.href} className="block px-3 py-2 rounded-lg hover:bg-background/50 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {r.label}
                </Link>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
