'use client'

import { Sparkles, FileText, HelpCircle, Search } from 'lucide-react'

const actions = [
  { label: 'Help me navigate', icon: HelpCircle, prompt: 'How do I navigate the ERP system?' },
  { label: 'Create an invoice', icon: FileText, prompt: 'How do I create an invoice in sales?' },
  { label: 'Generate a report', icon: Search, prompt: 'How can I generate a report?' },
  { label: 'ERP tips', icon: Sparkles, prompt: 'Give me some pro tips for using this ERP system efficiently.' },
]

interface QuickActionsProps {
  onSelect: (prompt: string) => void
}

export default function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ label, icon: Icon, prompt }) => (
        <button
          key={label}
          onClick={() => onSelect(prompt)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/50 bg-muted/50 hover:bg-muted hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
