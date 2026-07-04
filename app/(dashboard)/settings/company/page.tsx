'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Loader2, Upload } from 'lucide-react'

export default function CompanyPage() {
  const [form, setForm] = useState({ companyName: '', address: '', city: '', state: '', country: '', postalCode: '', phone: '', email: '', website: '', taxRegistrationNo: '', defaultCurrency: 'PKR', fiscalYearStart: '1', fiscalYearEnd: '12' })
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/setup/company').then(r => r.json()).then(d => {
      if (d.company) {
        setForm({
          companyName: d.company.companyName || '',
          address: d.company.address || '', city: d.company.city || '', state: d.company.state || '',
          country: d.company.country || '', postalCode: d.company.postalCode || '',
          phone: d.company.phone || '', email: d.company.email || '', website: d.company.website || '',
          taxRegistrationNo: d.company.taxRegistrationNo || '',
          defaultCurrency: d.company.defaultCurrency || 'PKR',
          fiscalYearStart: String(d.company.fiscalYearStart || 1),
          fiscalYearEnd: String(d.company.fiscalYearEnd || 12),
        })
        if (d.company.logoUrl) setLogoUrl(d.company.logoUrl)
      }
    }).catch(() => setError('Failed to load')).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const res = await fetch('/api/setup/company', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, fiscalYearStart: parseInt(form.fiscalYearStart), fiscalYearEnd: parseInt(form.fiscalYearEnd) }) })
      if (!res.ok) throw new Error('Failed')
      setMessage('Company details saved')
    } catch { setError('Failed to save') } finally { setSaving(false) }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const fd = new FormData(); fd.append('logo', file)
    try {
      const res = await fetch('/api/setup/company/logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) { setLogoUrl(data.logoUrl); setMessage('Logo uploaded') }
      else throw new Error('Failed')
    } catch { setError('Failed to upload logo') }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Company Setup</h1>
        <p className="text-muted-foreground mt-1">Configure your company details, logo, and financial year</p>
      </motion.div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}
      {message && <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">{message}</div>}

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Company Logo</h3>
        <div className="flex items-center gap-4">
          {logoUrl ? <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-border" /> : <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">No Logo</div>}
          <label className="px-4 py-2 bg-secondary text-foreground rounded-lg cursor-pointer hover:bg-secondary/80 flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Upload Logo
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Company Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-xs text-muted-foreground block mb-1">Company Name</label><input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} required className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div className="col-span-2"><label className="text-xs text-muted-foreground block mb-1">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">State</label><input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Country</label><input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Postal Code</label><input value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Website</label><input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Tax Registration No.</label><input value={form.taxRegistrationNo} onChange={e => setForm({ ...form, taxRegistrationNo: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Default Currency</label><select value={form.defaultCurrency} onChange={e => setForm({ ...form, defaultCurrency: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"><option value="PKR">PKR</option><option value="USD">USD</option><option value="INR">INR</option></select></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Fiscal Year Start (Month)</label><select value={form.fiscalYearStart} onChange={e => setForm({ ...form, fiscalYearStart: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}</select></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Fiscal Year End (Month)</label><select value={form.fiscalYearEnd} onChange={e => setForm({ ...form, fiscalYearEnd: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}</select></div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
