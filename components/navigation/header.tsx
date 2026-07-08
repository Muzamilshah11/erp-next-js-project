'use client'

import { motion } from 'framer-motion'
import { Search, User, Settings, BarChart3, Menu } from 'lucide-react'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { useAuth } from '@/contexts/auth-context'
import { CommandPalette } from './command-palette'
import { useState, useEffect } from 'react'

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
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
        className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors mr-2"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Company Logo */}
        <div className="flex items-center gap-3 mr-4">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.companyName || 'Company'}
              className="w-8 h-8 rounded-lg object-contain bg-slate-800"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Search — mobile icon */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true })
            document.dispatchEvent(event)
          }}
          className="md:hidden p-2 ml-auto text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
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

      {/* Right Actions */}
      <motion.div
        className="flex items-center gap-4 ml-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
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
      </motion.div>
    </motion.header>
    </>
  )
}
