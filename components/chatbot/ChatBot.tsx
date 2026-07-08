'use client'

import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, Search, Bot } from 'lucide-react'
import ChatMessage from './ChatMessage'
import QuickActions from './QuickActions'
import AIIcon from './AIIcon'

interface Message {
  role: 'user' | 'model'
  text: string
  suggestions?: string[]
}

function parseSuggestion(text: string): { cleanText: string; suggestions: string[] } {
  const separator = '---suggestions---'
  const separatorIndex = text.indexOf(separator)

  if (separatorIndex === -1) {
    return { cleanText: text, suggestions: [] }
  }

  return {
    cleanText: text.substring(0, separatorIndex).trim(),
    suggestions: text
      .substring(separatorIndex + separator.length)
      .trim()
      .split('\n')
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((s) => s.length > 0),
  }
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingText, scrollToBottom])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', text: text.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingText('')

    const history = messages.map((m) => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text,
    }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages((prev) => [...prev, { role: 'model', text: err.error || 'Something went wrong' }])
        setIsLoading(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setMessages((prev) => [...prev, { role: 'model', text: 'No response from server' }])
        setIsLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setStreamingText(fullText)
      }

      const { cleanText, suggestions } = parseSuggestion(fullText)
      setMessages((prev) => [...prev, { role: 'model', text: cleanText, suggestions }])
      setStreamingText('')
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setMessages((prev) => [...prev, { role: 'model', text: 'Network error. Please try again.' }])
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [messages, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-20 right-4 z-50 w-[380px] h-[560px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-cyan-600/10 to-blue-600/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <AIIcon size={18} />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">AI ERP Assistant</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <AIIcon size={32} />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">Hi! I'm AI ERP Assistant</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ask me anything about your ERP system. I can help with accounting, inventory, sales, and more!
                      </p>
                    </div>
                    <QuickActions onSelect={handleQuickAction} />
                  </div>
                )}

                {messages.map((msg, i) => (
                  <Fragment key={i}>
                    <ChatMessage role={msg.role} text={msg.text} />
                    {msg.suggestions && msg.suggestions.length > 0 && i === messages.length - 1 && !isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-2 pl-11"
                      >
                        {msg.suggestions.slice(0, 3).map((s, j) => (
                          <button
                            key={j}
                            onClick={() => handleQuickAction(s)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/50 bg-muted/50 hover:bg-muted hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[220px]">{s}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </Fragment>
                ))}

                {isLoading && streamingText && (
                  <ChatMessage role="model" text={streamingText} isStreaming />
                )}

                {isLoading && !streamingText && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                      <AIIcon size={18} />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 border border-border/50">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border p-3">
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 border border-border/50">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about ERP..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-40"
                  >
                    <Send className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </>
  )
}
