'use client'
import { motion } from 'framer-motion'
import { Package } from 'lucide-react'

export default function DeliveryNotesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Package className="w-8 h-8 text-primary" />
          Delivery Notes
        </h1>
        <p className="text-muted-foreground mt-1">Track deliveries and shipments</p>
      </div>
      <motion.div
        className="bg-card rounded-xl border border-border p-12 text-center shadow-sm"
        whileHover={{ y: -2 }}
      >
        <Package className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Delivery Notes</p>
        <p className="text-muted-foreground">Coming soon - Create and track delivery notes</p>
      </motion.div>
    </motion.div>
  )
}
