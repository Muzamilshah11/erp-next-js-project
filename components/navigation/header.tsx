'use client'

import { motion } from 'framer-motion'
import { Bell, Search, User, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export function Header() {
  const { user } = useAuth()

  return (
    <motion.header
      className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Search Bar */}
      <motion.div
        className="flex-1 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions, customers, orders..."
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-input rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </motion.div>

      {/* Right Actions */}
      <motion.div
        className="flex items-center gap-4 ml-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Notifications */}
        <motion.button
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-5 h-5" />
          <motion.span
            className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          />
        </motion.button>

        {/* Settings */}
        <motion.button
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-5 h-5" />
        </motion.button>

        {/* User Profile */}
        <motion.div
          className="flex items-center gap-3 pl-4 border-l border-border"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.fullName || 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role || 'User'}</p>
          </div>
          <motion.button
            className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <User className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.header>
  )
}
