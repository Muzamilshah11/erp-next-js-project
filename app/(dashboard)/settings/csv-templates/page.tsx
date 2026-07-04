'use client'

import { motion } from 'framer-motion'
import { Download, Package, Users, Building2, Briefcase } from 'lucide-react'

const modules = [
  { key: 'items', label: 'Items', desc: 'SKU, Name, Category, UnitPrice, Quantity, ReorderLevel, WarehouseCode', icon: <Package className="w-5 h-5" />, color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200' },
  { key: 'customers', label: 'Customers', desc: 'Name, Email, Phone, City, Status, SalesPersonEmail', icon: <Users className="w-5 h-5" />, color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200' },
  { key: 'suppliers', label: 'Suppliers', desc: 'Name, Email, Phone, City, ContactPerson, Status', icon: <Building2 className="w-5 h-5" />, color: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200' },
  { key: 'employees', label: 'Employees', desc: 'EmployeeNo, Name, Email, Phone, DepartmentName, DesignationName, BasicSalary, JoinDate', icon: <Briefcase className="w-5 h-5" />, color: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200' },
]

export default function CsvTemplatesPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">CSV Templates</h1>
        <p className="text-muted-foreground mt-1">Download pre-formatted CSV templates for bulk data import</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod, i) => (
          <motion.div key={mod.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-gradient-to-br ${mod.color} rounded-xl p-5 border`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><span className="text-muted-foreground/70">{mod.icon}</span><h3 className="font-semibold text-foreground">{mod.label}</h3></div>
              <a href={`/api/setup/csv-templates/${mod.key}`} download={`${mod.key}-template.csv`}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1 hover:shadow-lg">
                  <Download className="w-3.5 h-3.5" /> Download
                </motion.button>
              </a>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Columns:</p>
              <code className="text-xs text-foreground">{mod.desc}</code>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
