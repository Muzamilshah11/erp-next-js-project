'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { Search, X, Loader2, ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  label: string
  type: string
  href: string
}

const typeIcons: Record<string, string> = {
  Customer: '👤',
  Supplier: '🏢',
  Item: '📦',
  Invoice: '🧾',
  'Purchase Order': '📋',
  Employee: '👥',
  Account: '💰',
  'Journal Entry': '📓',
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout>()

  const toggle = useCallback(() => {
    setOpen(prev => {
      if (!prev) {
        setQuery('')
        setResults([])
        setSelectedIndex(0)
      }
      return !prev
    })
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, toggle])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results || [])
        setSelectedIndex(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  const select = useCallback(
    (index: number) => {
      const item = results[index]
      if (item) {
        setOpen(false)
        router.push(item.href)
      }
    },
    [results, router],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      select(selectedIndex)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="relative w-full max-w-xl mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search customers, suppliers, items, invoices..."
                className="flex-1 bg-transparent text-slate-100 text-sm placeholder-slate-500 outline-none"
              />
              {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
              {!loading && query && (
                <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-800 rounded border border-slate-600">
                <ArrowUpDown className="w-3 h-3" />
              </kbd>
            </div>

            {query.length < 2 && query.length > 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Type at least 2 characters to search
              </div>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No results found for "{query}"
              </div>
            )}

            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto py-2 scrollbar-thin">
                {results.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => select(index)}
                  >
                    <span className="text-base shrink-0">{typeIcons[item.type] || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{item.label}</span>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{item.type}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
