'use client'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

export default function AdjustmentsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          Stock Adjustments
        </h1>
        <p className="text-muted-foreground mt-1">Record inventory adjustments</p>
      </div>
      <motion.div
        className="bg-card rounded-xl border border-border p-12 text-center shadow-sm"
        whileHover={{ y: -2 }}
      >
        <TrendingUp className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Stock Adjustments</p>
        <p className="text-muted-foreground">Coming soon - Record stock adjustments and variances</p>
      </motion.div>
    </motion.div>
  )
}
