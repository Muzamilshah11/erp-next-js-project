'use client'

import { motion } from 'framer-motion'
import { Settings, Building2, DollarSign, Users } from 'lucide-react'

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your system configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { icon: Building2, label: 'Company', desc: 'Configure company details' },
          { icon: DollarSign, label: 'Fiscal Year', desc: 'Manage accounting periods' },
          { icon: Users, label: 'Users', desc: 'Manage user accounts' },
          { icon: Settings, label: 'Tax Configuration', desc: 'Setup tax rates' },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            whileHover={{ y: -4 }}
            className="bg-card rounded-xl border border-border p-6 shadow-sm cursor-pointer hover:shadow-lg transition-shadow"
          >
            <motion.div className="flex items-start gap-4" whileHover={{ x: 4 }}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{item.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
