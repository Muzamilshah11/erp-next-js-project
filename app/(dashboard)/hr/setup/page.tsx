'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

interface TabProps { label: string; active: boolean; onClick: () => void }
function Tab({ label, active, onClick }: TabProps) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
      {label}
    </button>
  )
}

function SetupTable<T extends { id: string; name: string }>({ data, columns, onEdit, onDelete, title }: {
  data: T[]; columns: { key: string; label: string; render?: (v: unknown) => React.ReactNode }[]; onEdit: (item: T) => void; onDelete: (id: string) => void; title: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            {columns.map(c => <th key={c.key} className="text-left px-4 py-3 font-medium text-muted-foreground">{c.label}</th>)}
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={item.id} className={`border-b border-border ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/40`}>
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-3">
                    {c.render ? c.render((item as Record<string, unknown>)[c.key]) : String((item as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onEdit(item)} className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">No {title.toLowerCase()} found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type SetupForm = Record<string, string>

function SetupFormFields({ fields, form, onChange, entity }: { fields: { key: string; label: string; type?: string }[]; form: SetupForm; onChange: (k: string, v: string) => void; entity: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {fields.map(f => (
        <div key={f.key}>
          <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
          {f.type === 'select' ? (
            <select value={form[f.key] || ''} onChange={e => onChange(f.key, e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              {(f as unknown as Record<string, string[]>).options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => onChange(f.key, e.target.value)} placeholder={f.label} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function SetupPage() {
  const [activeTab, setActiveTab] = useState('departments')
  const [data, setData] = useState<Record<string, unknown[]>>({})
  const [form, setForm] = useState<SetupForm>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const tabs = ['departments', 'designations', 'grades', 'attendance-policies', 'tax-slabs', 'gl-mapping', 'leave-types']

  const fieldConfigs: Record<string, { key: string; label: string; type?: string; options?: string[] }[]> = {
    departments: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description' }],
    designations: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description' }],
    grades: [
      { key: 'name', label: 'Name' },
      { key: 'basicSalary', label: 'Basic Salary', type: 'number' },
      { key: 'houseRentPercent', label: 'House Rent %', type: 'number' },
      { key: 'medicalPercent', label: 'Medical %', type: 'number' },
      { key: 'transportPercent', label: 'Transport %', type: 'number' },
    ],
    'attendance-policies': [
      { key: 'name', label: 'Name' },
      { key: 'workingDaysPerWeek', label: 'Working Days/Week', type: 'number' },
      { key: 'hoursPerDay', label: 'Hours/Day', type: 'number' },
      { key: 'lateThreshold', label: 'Late Threshold (min)', type: 'number' },
      { key: 'earlyThreshold', label: 'Early Threshold (min)', type: 'number' },
      { key: 'overtimeRate', label: 'OT Rate (x)', type: 'number' },
    ],
    'tax-slabs': [
      { key: 'fiscalYear', label: 'Fiscal Year' },
      { key: 'minIncome', label: 'Min Income', type: 'number' },
      { key: 'maxIncome', label: 'Max Income', type: 'number' },
      { key: 'rate', label: 'Rate (%)', type: 'number' },
      { key: 'fixedAmount', label: 'Fixed Amount', type: 'number' },
    ],
    'gl-mapping': [
      { key: 'module', label: 'Module' },
      { key: 'debitAccountId', label: 'Debit Account ID' },
      { key: 'creditAccountId', label: 'Credit Account ID' },
      { key: 'description', label: 'Description' },
    ],
    'leave-types': [
      { key: 'name', label: 'Name' },
      { key: 'daysPerYear', label: 'Days/Year', type: 'number' },
      { key: 'isPaid', label: 'Is Paid', type: 'select', options: ['true', 'false'] },
    ],
  }

  const tableColumns: Record<string, { key: string; label: string; render?: (v: unknown) => React.ReactNode }[]> = {
    departments: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description' }, { key: 'status', label: 'Status' }],
    designations: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description' }, { key: 'status', label: 'Status' }],
    grades: [
      { key: 'name', label: 'Name' },
      { key: 'basicSalary', label: 'Basic Salary', render: (v: unknown) => (v as number)?.toLocaleString() },
      { key: 'houseRentPercent', label: 'HR %' },
      { key: 'medicalPercent', label: 'Med %' },
    ],
    'attendance-policies': [
      { key: 'name', label: 'Name' },
      { key: 'workingDaysPerWeek', label: 'Days' },
      { key: 'hoursPerDay', label: 'Hours' },
      { key: 'overtimeRate', label: 'OT Rate' },
    ],
    'tax-slabs': [
      { key: 'fiscalYear', label: 'Year' },
      { key: 'minIncome', label: 'Min', render: (v: unknown) => (v as number)?.toLocaleString() },
      { key: 'maxIncome', label: 'Max', render: (v: unknown) => v ? (v as number).toLocaleString() : '∞' },
      { key: 'rate', label: 'Rate', render: (v: unknown) => `${((v as number) * 100)}%` },
    ],
    'gl-mapping': [
      { key: 'module', label: 'Module' },
      { key: 'debitAccountId', label: 'Debit Account' },
      { key: 'creditAccountId', label: 'Credit Account' },
    ],
    'leave-types': [
      { key: 'name', label: 'Name' },
      { key: 'daysPerYear', label: 'Days/Year' },
      { key: 'isPaid', label: 'Paid', render: (v: unknown) => v ? 'Yes' : 'No' },
    ],
  }

  const apiPaths: Record<string, string> = {
    departments: '/api/hr/setup/departments',
    designations: '/api/hr/setup/designations',
    grades: '/api/hr/setup/grades',
    'attendance-policies': '/api/hr/setup/attendance-policies',
    'tax-slabs': '/api/hr/setup/tax-slabs',
    'gl-mapping': '/api/hr/setup/gl-mapping',
    'leave-types': '/api/hr/setup/leave-types',
  }

  const fetchData = async () => {
    setError('')
    try {
      const res = await fetch(apiPaths[activeTab])
      const json = await res.json()
      const key = activeTab === 'attendance-policies' ? 'policies'
        : activeTab === 'tax-slabs' ? 'taxSlabs'
        : activeTab === 'gl-mapping' ? 'mappings'
        : activeTab === 'leave-types' ? 'leaveTypes'
        : activeTab
      setData(prev => ({ ...prev, [activeTab]: json[key] || [] }))
    } catch { setError('Failed to fetch') }
  }

  useEffect(() => { fetchData() }, [activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const url = editing ? `${apiPaths[activeTab]}/${editing}` : apiPaths[activeTab]
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      setForm({}); setEditing(null); fetchData()
    } catch { setError('Failed to save') }
    finally { setSaving(false) }
  }

  const handleEdit = (item: Record<string, unknown>) => {
    const f: SetupForm = {}
    for (const field of fieldConfigs[activeTab]) {
      f[field.key] = String(item[field.key] ?? '')
    }
    setForm(f); setEditing(item.id as string)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await fetch(`${apiPaths[activeTab]}/${id}`, { method: 'DELETE' })
      fetchData()
    } catch { setError('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">HR Setup</h1>
        <p className="text-muted-foreground mt-1">Configure departments, designations, grades, policies, tax slabs, GL mappings, and leave types</p>
      </motion.div>

      <div className="flex gap-2 flex-wrap border-b border-border pb-2">
        {tabs.map(t => (
          <Tab key={t} label={t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} active={activeTab === t} onClick={() => { setActiveTab(t); setForm({}); setEditing(null) }} />
        ))}
      </div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></motion.div>}

      <motion.form key={activeTab} onSubmit={handleSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">{editing ? 'Edit' : 'Add'} {activeTab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
        <SetupFormFields fields={fieldConfigs[activeTab]} form={form} onChange={(k, v) => setForm(prev => ({ ...prev, [k]: v }))} entity={activeTab} />
        <div className="flex gap-2 justify-end">
          {editing && <button type="button" onClick={() => { setForm({}); setEditing(null) }} className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-secondary">Cancel</button>}
          <button type="submit" disabled={saving || !form.name} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-1">
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}{editing ? 'Update' : 'Add'}
          </button>
        </div>
      </motion.form>

      <SetupTable
        data={(data[activeTab] || []) as { id: string; name: string }[]}
        columns={tableColumns[activeTab]}
        onEdit={handleEdit}
        onDelete={handleDelete}
        title={activeTab.replace('-', ' ')}
      />
    </div>
  )
}
