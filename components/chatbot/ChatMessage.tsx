'use client'

import { Bot, User } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
  role: 'user' | 'model'
  text: string
  isStreaming?: boolean
}

export default function ChatMessage({ role, text, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-md'
            : 'bg-muted text-foreground rounded-tl-md border border-border/50'
        }`}
      >
        {isUser ? (
          text
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
            prose-p:text-foreground prose-p:leading-relaxed prose-p:my-1
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:my-1 prose-li:my-0.5
            prose-code:text-cyan-600 dark:prose-code:text-cyan-400 prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded
            prose-pre:bg-muted/80 prose-pre:border prose-pre:border-border/50
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-hr:border-border/50">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        )}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-foreground/60 ml-0.5 animate-pulse" />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </motion.div>
  )
}
