'use client'

import { motion } from 'framer-motion'
import { KPICard } from '@/components/dashboard/kpi-card'
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useState, useEffect } from 'react'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#6366f1']

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `PKR ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `PKR ${(value / 1_000).toFixed(1)}K`
  return `PKR ${value.toFixed(0)}`
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-PK')
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kpis, setKpis] = useState({ totalRevenue: 0, orders: 0, inventoryValue: 0, activeCustomers: 0 })
  const [revenueTrend, setRevenueTrend] = useState<{ name: string; value: number; target: number }[]>([])
  const [inventoryMix, setInventoryMix] = useState<{ name: string; value: number }[]>([])
  const [salesAnalysis, setSalesAnalysis] = useState<{ name: string; sales: number; returns: number }[]>([])

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => {
        setKpis(data.kpis)
        setRevenueTrend(data.revenueTrend || [])
        setInventoryMix(data.inventoryMix || [])
        setSalesAnalysis(data.salesAnalysis || [])
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium mb-2">Error</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here&apos;s your business overview.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          change={12.5}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
          delay={0}
        />
        <KPICard
          label="Orders"
          value={formatNumber(kpis.orders)}
          change={8.2}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="green"
          delay={0.1}
        />
        <KPICard
          label="Inventory Value"
          value={formatCurrency(kpis.inventoryValue)}
          change={-2.4}
          icon={<Package className="w-6 h-6" />}
          color="purple"
          delay={0.2}
        />
        <KPICard
          label="Active Customers"
          value={formatNumber(kpis.activeCustomers)}
          change={5.1}
          icon={<Users className="w-6 h-6" />}
          color="amber"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <motion.div
          className="lg:col-span-2 bg-card rounded-lg border border-black/20 dark:border-black/40 p-4 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileHover={{ y: -2 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Revenue Trend
            </h3>
            {revenueTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No revenue data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    name="Actual"
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorTarget)"
                    name="Target"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          className="bg-card rounded-lg border border-black/20 dark:border-black/40 p-4 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileHover={{ y: -2 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Inventory Mix
            </h3>
            {inventoryMix.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No inventory data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={inventoryMix}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryMix.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="bg-card rounded-lg border border-black/20 dark:border-black/40 p-4 shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        whileHover={{ y: -2 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Sales & Returns Analysis
          </h3>
          {salesAnalysis.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
                <Legend />
                <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Sales" />
                <Bar dataKey="returns" fill="#ef4444" radius={[8, 8, 0, 0]} name="Returns" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
