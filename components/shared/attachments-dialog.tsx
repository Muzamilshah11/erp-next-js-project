'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Download, Trash2, Loader2, Paperclip } from 'lucide-react'

interface Attachment {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedBy: { id: string; fullName: string } | null
  createdAt: string
}

interface AttachmentsDialogProps {
  entityType: string
  entityId: string
  entityLabel: string
  open: boolean
  onClose: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentsDialog({ entityType, entityId, entityLabel, open, onClose }: AttachmentsDialogProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchAttachments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/setup/attachments?entityType=${entityType}&entityId=${entityId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAttachments(data.attachments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setError('')
      fetchAttachments()
    }
  }, [open, entityType, entityId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', entityType)
      formData.append('entityId', entityId)
      const res = await fetch('/api/setup/attachments', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      fetchAttachments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this attachment?')) return
    try {
      const res = await fetch(`/api/setup/attachments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setAttachments(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Attachments</h3>
                <span className="text-xs text-slate-500">{entityLabel}</span>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <input
                ref={fileRef}
                type="file"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-700 rounded-lg text-sm text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>

              {error && (
                <p className="mt-2 text-xs text-red-400">{error}</p>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto border-t border-slate-700 scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-500">No attachments yet</p>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{att.fileName}</p>
                        <p className="text-xs text-slate-500">
                          {formatSize(att.fileSize)} — {att.uploadedBy?.fullName || 'Unknown'} — {new Date(att.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={att.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(att.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
