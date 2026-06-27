'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useEffect, useState } from 'react'

interface KPICardProps {
  label: string
  value: string
  change: number
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'amber'
  delay?: number
}

export function KPICard({ label, value, change, icon, color = 'blue', delay = 0 }: KPICardProps) {
  const [animatedValue, setAnimatedValue] = useState('0')
  const isPositive = change >= 0

  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-600 dark:text-blue-400',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-600 dark:text-green-400',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 text-purple-600 dark:text-purple-400',
    amber: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 text-amber-600 dark:text-amber-400',
  }

  useEffect(() => {
    // Animate number counting up
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''))
    if (!isNaN(numValue)) {
      let current = 0
      const increment = numValue / 30
      const interval = setInterval(() => {
        current += increment
        if (current >= numValue) {
          setAnimatedValue(value)
          clearInterval(interval)
        } else {
          const prefix = value.match(/[^0-9.-]/g)?.[0] || ''
          setAnimatedValue(prefix + Math.floor(current).toLocaleString())
        }
      }, 20)
    }
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-3 border border-black/25 dark:border-black/40 shadow-md hover:shadow-lg transition-shadow cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
          <motion.h3
            className="text-2xl font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
          >
            {animatedValue}
          </motion.h3>
          <motion.div
            className="flex items-center gap-1 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3, duration: 0.3 }}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
            )}
            <span className={`text-xs font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </motion.div>
        </div>
        <motion.div
          className={`p-2 ${colorClasses[color]} rounded-lg flex-shrink-0`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  )
}
