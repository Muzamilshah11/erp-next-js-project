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
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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

const revenueData = [
  { name: 'Jan', value: 45000, target: 50000 },
  { name: 'Feb', value: 52000, target: 50000 },
  { name: 'Mar', value: 48000, target: 50000 },
  { name: 'Apr', value: 61000, target: 50000 },
  { name: 'May', value: 55000, target: 50000 },
  { name: 'Jun', value: 67000, target: 50000 },
]

const inventoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 25 },
  { name: 'Food', value: 20 },
  { name: 'Books', value: 12 },
  { name: 'Others', value: 8 },
]

const salesByMonth = [
  { name: 'Jan', sales: 24000, returns: 2400 },
  { name: 'Feb', sales: 26000, returns: 2210 },
  { name: 'Mar', sales: 22000, returns: 2290 },
  { name: 'Apr', sales: 27000, returns: 2000 },
  { name: 'May', sales: 25000, returns: 2181 },
  { name: 'Jun', sales: 30000, returns: 2500 },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here&apos;s your business overview.</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Revenue"
          value="PKR 2.45M"
          change={12.5}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
          delay={0}
        />
        <KPICard
          label="Orders"
          value="1,245"
          change={8.2}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="green"
          delay={0.1}
        />
        <KPICard
          label="Inventory Value"
          value="PKR 845K"
          change={-2.4}
          icon={<Package className="w-6 h-6" />}
          color="purple"
          delay={0.2}
        />
        <KPICard
          label="Active Customers"
          value="387"
          change={5.1}
          icon={<Users className="w-6 h-6" />}
          color="amber"
          delay={0.3}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue Trend */}
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
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
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
          </motion.div>
        </motion.div>

        {/* Inventory Breakdown */}
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
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryData.map((entry, index) => (
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
          </motion.div>
        </motion.div>
      </div>

      {/* Sales Analysis */}
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
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByMonth}>
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
        </motion.div>
      </motion.div>
    </div>
  )
}
