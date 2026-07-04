'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Upload, Loader2 } from 'lucide-react'

export default function SalesImportPage() {
  const [importType, setImportType] = useState('customers')
  const [csvData, setCsvData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [results, setResults] = useState<any[]>([])
  const [importing, setImporting] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return
      const hdrs = lines[0].split(',').map(h => h.trim())
      const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()))
      setHeaders(hdrs)
      setCsvData(rows)
      setResults([])
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const records = csvData.map(row => {
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = row[i] || '' })
        return obj
      })
      const res = await fetch('/api/sales/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: importType, records }),
      })
      const data = await res.json()
      setResults(data.results ?? [])
    } finally { setImporting(false) }
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-semibold">Import</h1><p className="text-sm text-muted-foreground mt-1">Import customers, invoices, or credit notes from CSV</p></div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Import Type</Label>
          <Select value={importType} onValueChange={setImportType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="customers">Customers</SelectItem>
              <SelectItem value="invoices">Invoices</SelectItem>
              <SelectItem value="credit-notes">Credit Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>CSV File</Label>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">Upload a CSV file with headers</p>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="block mx-auto text-sm" />
          </div>
        </div>

        {csvData.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground">
              {csvData.length} records found with headers: {headers.join(', ')}
            </div>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Import {csvData.length} Records
            </Button>
          </>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-3">
              <Badge className="bg-green-100 text-green-800">{successCount} successful</Badge>
              {failCount > 0 && <Badge className="bg-red-100 text-red-800">{failCount} failed</Badge>}
            </div>
            {results.filter(r => !r.success).map((r, i) => (
              <p key={i} className="text-xs text-red-600">{r.error}</p>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
