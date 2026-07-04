'use client'

import { motion } from 'framer-motion'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface InvItem { id: string; name: string; sku: string }
interface Warehouse { id: string; name: string }
interface WorkCenter { id: string; name: string }
interface WOItem { id: string; item: InvItem; quantity: number; consumedQty: number; type: string }
interface WorkOrder {
  id: string; workOrderNo: string; type: string; item: InvItem; bom: { id: string; bomNo: string; name: string } | null
  workCenter: WorkCenter | null; sourceWarehouse: Warehouse | null; destinationWarehouse: Warehouse | null
  quantity: number; producedQty: number; status: string; startDate: string | null; endDate: string | null; items: WOItem[]
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

const statusSteps = ['draft', 'in-progress', 'completed']

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/manufacturing/orders/${id}`); const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Not found')
      setOrder(data.order)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrder() }, [id])

  if (loading) return <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>
  if (error) return <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}</div>
  if (!order) return null

  const currentIdx = statusSteps.indexOf(order.status)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link href="/manufacturing/orders" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{order.workOrderNo}</h1>
          <p className="text-muted-foreground mt-1">{order.type === 'assemble' ? 'Production' : 'Un-Assembly'} Order</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${statusColors[order.status]}`}>{order.status}</span>
      </motion.div>

      {/* Status Timeline */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2">
          {statusSteps.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium capitalize ${i <= currentIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{step.replace('-', ' ')}</span>
              {i < statusSteps.length - 1 && <div className={`flex-1 h-0.5 ${i < currentIdx ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Detail Grid */}
      <div className="grid grid-cols-2 gap-4">
        <DetailCard title="Item" value={order.item?.name || '-'} sub={order.item?.sku} />
        <DetailCard title="Type" value={order.type === 'assemble' ? 'Assemble (Production)' : 'Un-Assemble (Reverse)'} />
        <DetailCard title="Quantity" value={String(order.quantity)} />
        <DetailCard title="Produced" value={String(order.producedQty || 0)} />
        <DetailCard title="Work Center" value={order.workCenter?.name || '-'} />
        <DetailCard title="BOM" value={order.bom ? `${order.bom.bomNo} - ${order.bom.name}` : '-'} />
        <DetailCard title="Source Warehouse" value={order.sourceWarehouse?.name || '-'} />
        <DetailCard title="Destination Warehouse" value={order.destinationWarehouse?.name || '-'} />
        <DetailCard title="Start Date" value={order.startDate ? new Date(order.startDate).toLocaleDateString() : '-'} />
        <DetailCard title="End Date" value={order.endDate ? new Date(order.endDate).toLocaleDateString() : '-'} />
      </div>

      {/* Items */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Order Items</h3>
        <div className="space-y-2">
          {order.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between items-center px-4 py-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${it.type === 'finished-good' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{it.item?.name || it.itemId}</p>
                  <p className="text-xs text-muted-foreground">{it.item?.sku} — {it.type === 'finished-good' ? 'Finished Good' : 'Component'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{it.type === 'finished-good' ? '+' : '-'}{it.quantity}</p>
                {it.consumedQty > 0 && <p className="text-xs text-muted-foreground">Consumed: {it.consumedQty}</p>}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function DetailCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
      <p className="text-lg font-semibold text-foreground mt-1">{value}</p>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </motion.div>
  )
}