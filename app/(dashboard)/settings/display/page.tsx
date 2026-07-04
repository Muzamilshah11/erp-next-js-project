'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function DisplayPage() {
  const [settings, setSettings] = useState({ dateFormat: 'DD/MM/YYYY', currencyPosition: 'before', decimalPlaces: '2', thousandSeparator: 'comma', timezone: 'Asia/Karachi' })
  const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(''); const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/setup/settings').then(r => r.json()).then(d => {
      if (d.grouped?.display) {
        const s = d.grouped.display
        setSettings({
          dateFormat: s.dateFormat || 'DD/MM/YYYY',
          currencyPosition: s.currencyPosition || 'before',
          decimalPlaces: s.decimalPlaces || '2',
          thousandSeparator: s.thousandSeparator || 'comma',
          timezone: s.timezone || 'Asia/Karachi',
        })
      }
    }).catch(() => setError('Failed to load')).finally(() => setLoading(false))
  }, [])

  const saveSetting = async (key: string, value: string) => {
    try {
      await fetch(`/api/setup/settings/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value, group: 'display' }) })
    } catch { setError('Failed to save') }
  }

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    saveSetting(key, value)
    setMessage(`${key.replace(/([A-Z])/g, ' $1')} updated`)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Display Setup</h1>
        <p className="text-muted-foreground mt-1">Configure date format, currency display, and regional preferences</p>
      </motion.div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}
      {message && <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">{message} <button onClick={() => setMessage('')} className="ml-2 underline">OK</button></div>}

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="text-sm font-medium block mb-1">Date Format</label>
          <select value={settings.dateFormat} onChange={e => handleChange('dateFormat', e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background">
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">Preview: {new Date().toLocaleDateString('en-PK')}</p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Currency Position</label>
          <select value={settings.currencyPosition} onChange={e => handleChange('currencyPosition', e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background">
            <option value="before">Before amount (Rs. 1,000)</option>
            <option value="after">After amount (1,000 Rs.)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Decimal Places</label>
          <select value={settings.decimalPlaces} onChange={e => handleChange('decimalPlaces', e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background">
            <option value="0">0 (No decimals)</option>
            <option value="2">2 (1,000.00)</option>
            <option value="3">3 (1,000.000)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Thousand Separator</label>
          <select value={settings.thousandSeparator} onChange={e => handleChange('thousandSeparator', e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background">
            <option value="comma">Comma (1,000)</option>
            <option value="dot">Dot (1.000)</option>
            <option value="space">Space (1 000)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Timezone</label>
          <select value={settings.timezone} onChange={e => handleChange('timezone', e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background">
            <option value="Asia/Karachi">Asia/Karachi (PKT +05:00)</option>
            <option value="Asia/Dubai">Asia/Dubai (+04:00)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
    </div>
  )
}
