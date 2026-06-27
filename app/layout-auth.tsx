import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ERP Pro - Authentication',
  description: 'Sign in or create an account to access ERP Pro',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
