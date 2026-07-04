'use client'

import { motion } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Search, Loader2, Package } from 'lucide-react'
import { useState, useEffect } from 'react'

interface InvItem { id: string; name: string; sku: string }
interface BOM { id: string; bomNo: string; name: string; item: InvItem; _count: { items: number } }
interface Result { bom: BOM; quantity: number }

const bomCols = [
  { key: 'bom' as const, label: 'BOM No', render: (v: BOM) => <span className="font-mono font-semibold text-primary">{v?.bomNo}</span> },
  { key: 'bom' as const, label: 'Finished Good', render: (v: BOM) => <span className="font-medium">{v?.item?.name}</span> },
  { key: 'quantity' as const, label: 'Qty per BOM', render: (v: number) => v },
]

export default function InquiriesPage() {
  const [tab, setTab] = useState<'where-used' | 'work-order'>('where-used')
  const [items, setItems] = useState<InvItem[]>([])
  const [selectedItem, setSelectedItem] = useState('')
  const [results, setResults] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => { fetch('/api/inventory/items').then(r => r.json()).then(d => setItems(d.items || [])) }, [])

  const searchInquiry = async () => {
    if (!selectedItem) return
    setLoading(true); setSearched(true)
    try {
      const res = await fetch(`/api/manufacturing/inquiries?itemId=${selectedItem}&type=${tab}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (selectedItem) searchInquiry() }, [tab])

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Package className="w-8 h-8 text-primary" /> Manufacturing Inquiries</h1>
        <p className="text-muted-foreground mt-1">Where-used and work order inquiries</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Inquiry Type</label>
            <div className="flex gap-2">
              <button onClick={() => setTab('where-used')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'where-used' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}>Where Used</button>
              <button onClick={() => setTab('work-order')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'work-order' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}>Work Order Inquiry</button>
            </div>
          </div>
          <div className="flex-1 max-w-md space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Select Item</label>
            <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="w-full px-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select an item...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
            </select>
          </div>
          <button onClick={searchInquiry} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:shadow-lg"><Search className="w-4 h-4" /> Search</button>
        </div>
      </motion.div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Searching...</p></div>
      ) : searched && results.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">No results found for this item.</p>
          {tab === 'where-used' && <p className="text-xs text-muted-foreground mt-2">This item is not used as a component in any BOM.</p>}
        </div>
      ) : tab === 'where-used' ? (
        <DataTable columns={bomCols} data={results as Result[]} title="Where Used — BOMs using this component"
          expandRow={(row) => (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">BOM: {(row as Result).bom?.bomNo} — {(row as Result).bom?.name || (row as Result).bom?.item?.name}</p>
              <p className="text-sm text-muted-foreground">Components count: {(row as Result).bom?._count?.items}</p>
            </div>
          )}
        />
      ) : (
        <DataTable columns={[
          { key: 'item' as const, label: 'Item', render: (v: InvItem) => v?.name },
          { key: 'workOrderNo' as const, label: 'Order No', render: (v: string) => <span className="font-mono font-semibold text-primary">{v}</span> },
          { key: 'workCenter' as const, label: 'Work Center', render: (v: { name: string }) => v?.name || '-' },
          { key: 'quantity' as const, label: 'Quantity' },
          { key: 'status' as const, label: 'Status' },
        ]} data={results as any[]} title="Work Orders for this item" />
      )}
    </div>
  )
}