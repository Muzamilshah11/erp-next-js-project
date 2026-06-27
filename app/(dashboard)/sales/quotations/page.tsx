'use client'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

export default function QuotationsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          Quotations
        </h1>
        <p className="text-muted-foreground mt-1">Create and manage sales quotations</p>
      </div>
      <motion.div
        className="bg-card rounded-xl border border-border p-12 text-center shadow-sm"
        whileHover={{ y: -2 }}
      >
        <FileText className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Sales Quotations</p>
        <p className="text-muted-foreground">Coming soon - Create and track sales quotations</p>
      </motion.div>
    </motion.div>
  )
}
