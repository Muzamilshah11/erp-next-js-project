'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/shared/data-table'
import { Plus, Pencil, Trash2, Search, X, Loader2, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Article { id: string; articleNo: string; title: string; category: { id: string; name: string } | null; tags: string | null; status: string; createdAt: string }

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState({ title: '', content: '', categoryId: '', tags: '', status: 'draft' })
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  const fetchArticles = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      const res = await fetch(`/api/crm/kb-articles?${params}`); const d = await res.json()
      if (!res.ok) throw new Error(d.error); setArticles(d.articles)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchArticles(); fetch('/api/crm/kb-categories').then(r => r.json()).then(d => setCategories(d.categories)).catch(() => {}) }, [])

  const openNew = () => { setEditing(null); setForm({ title: '', content: '', categoryId: '', tags: '', status: 'draft' }); setShowForm(true) }
  const openEdit = (a: Article) => { setEditing(a); setForm({ title: a.title, content: '', categoryId: a.category?.id || '', tags: a.tags || '', status: a.status }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.title.trim()) { setError('Title required'); return }
    setSaving(true); setError('')
    try {
      const url = editing ? `/api/crm/kb-articles/${editing.id}` : '/api/crm/kb-articles'
      const method = editing ? 'PUT' : 'POST'
      const body = { ...form, tags: form.tags || null, categoryId: form.categoryId || null }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowForm(false); setEditing(null); fetchArticles()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (a: Article) => {
    if (!window.confirm('Delete this article?')) return
    try { const res = await fetch(`/api/crm/kb-articles/${a.id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Failed'); fetchArticles() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1><p className="text-muted-foreground mt-1">Manage articles and documentation</p></div>
        <motion.button onClick={openNew} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" />New Article</motion.button>
      </motion.div>

      <div className="flex gap-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <button onClick={fetchArticles} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Search</button>
      </div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? 'Edit Article' : 'New Article'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Category</label><select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
              <div><label className="block text-sm text-muted-foreground mb-1">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg bg-background"><option value="draft">Draft</option><option value="published">Published</option></select></div>
              <textarea placeholder="Content (HTML/Markdown)" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8} className="col-span-2 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm" />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Update' : 'Create'}</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading articles...</p></div>
      ) : (
        <DataTable columns={[
          { key: 'articleNo', label: 'Article No', sortable: true },
          { key: 'title', label: 'Title' },
          { key: 'category.name', label: 'Category', render: (_: unknown, row: Article) => row.category?.name || '-' },
          { key: 'tags', label: 'Tags' },
          { key: 'status', label: 'Status', render: (_: unknown, row: Article) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'}`}>{row.status}</span> },
          { key: 'createdAt', label: 'Created', render: (_: unknown, row: Article) => new Date(row.createdAt).toLocaleDateString() },
        ]} data={articles} title="All Articles" actions={(row: Article) => (
          <div className="flex items-center gap-1">
            <Link href={`/crm/knowledge-base/articles/${row.id}`} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex"><Eye className="w-4 h-4" /></Link>
            <motion.button onClick={() => openEdit(row)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} title="Edit"><Pencil className="w-4 h-4" /></motion.button>
            <motion.button onClick={() => handleDelete(row)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" whileHover={{ scale: 1.1 }} title="Delete"><Trash2 className="w-4 h-4" /></motion.button>
          </div>
        )} />
      )}
    </div>
  )
}