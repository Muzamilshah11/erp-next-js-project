'use client'

import { motion } from 'framer-motion'
import { Search, User, Settings, BarChart3 } from 'lucide-react'

import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { useAuth } from '@/contexts/auth-context'
import { CommandPalette } from './command-palette'
import { useState, useEffect } from 'react'

export function Header() {
  const { user } = useAuth()
  const [company, setCompany] = useState<{ companyName?: string; logoUrl?: string } | null>(null)

  useEffect(() => {
    fetch('/api/setup/company')
      .then(r => r.json())
      .then(d => setCompany(d.company))
      .catch(() => {})
  }, [])

  return (
    <>
      <CommandPalette />
      <motion.header
        className="h-16 bg-card border-b border-border flex items-center px-6 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Left spacer — centers logo on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Company Logo */}
        <div className="flex items-center gap-3">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.companyName || 'Company'}
              className="w-10 h-10 md:w-14 md:h-14 rounded-lg object-contain bg-slate-800"
            />
          ) : (
            <img
              src="/logoo.png"
              alt="ERP Pro"
              className="w-10 h-10 md:w-14 md:h-14 object-contain"
            />
          )}
        </div>

        {/* Right section — search + actions */}
        <div className="flex-1 flex items-center justify-end gap-4">
          {/* Search — mobile icon */}
          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true })
              document.dispatchEvent(event)
            }}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Search — desktop full input */}
          <motion.div
            className="hidden md:block flex-1 max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                readOnly
                placeholder="Search transactions, customers, orders...  (Ctrl+K)"
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-input rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                onClick={() => {
                  const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true })
                  document.dispatchEvent(event)
                }}
              />
            </div>
          </motion.div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Settings — desktop only */}
          <motion.button
            className="hidden md:block p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          {/* User Profile — desktop only */}
          <motion.div
            className="hidden md:flex items-center gap-3 pl-4 border-l border-border"
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
        </div>
    </motion.header>
    </>
  )
}
