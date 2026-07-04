'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Article { id: string; articleNo: string; title: string; content: string | null; category: { id: string; name: string } | null; tags: string | null; fileAttachments: string | null; status: string; createdAt: string; updatedAt: string }

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetch(`/api/crm/kb-articles/${id}`).then(r => r.json()).then(d => { setArticle(d.article); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="bg-card rounded-xl border border-border p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading article...</p></div>
  if (!article) return <div className="p-6 text-center text-muted-foreground">Article not found</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/crm/knowledge-base/articles"><motion.button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors mb-4" whileHover={{ scale: 1.1 }}><ArrowLeft className="w-5 h-5" /></motion.button></Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground">{article.title}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${article.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'}`}>{article.status}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{article.articleNo}</span>
          {article.category && <span>Category: {article.category.name}</span>}
          {article.tags && <span>Tags: {article.tags}</span>}
          <span>Updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
        </div>
      </motion.div>

      {article.content && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">{article.content}</div>
        </motion.div>
      )}

      {article.fileAttachments && (() => {
        try {
          const files = JSON.parse(article.fileAttachments)
          return Array.isArray(files) && files.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Attachments</h3>
              <div className="space-y-1">{files.map((f: { fileName: string; fileUrl: string }, i: number) => <a key={i} href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">{f.fileName}</a>)}</div>
            </motion.div>
          ) : null
        } catch { return null }
      })()}
    </div>
  )
}