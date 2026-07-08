'use client'

interface AIIconProps {
  size?: number
  className?: string
}

export default function AIIcon({ size = 32, className = '' }: AIIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`ai-grad-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {/* Circle background */}
      <circle cx="16" cy="16" r="15" fill={`url(#ai-grad-${size})`} />
      {/* Headset */}
      <path d="M10 18v-2a6 6 0 0112 0v2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M10 18a2 2 0 00-2 2v1a2 2 0 002 2h1v-5z" fill="white" />
      <path d="M22 18a2 2 0 012 2v1a2 2 0 01-2 2h-1v-5z" fill="white" />
      {/* AI text */}
      <text x="16" y="27" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="700" fontFamily="Arial, sans-serif">
        AI
      </text>
    </svg>
  )
}
