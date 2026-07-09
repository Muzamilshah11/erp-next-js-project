'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

export default function PersonsGroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [persons, setPersons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [editingPerson, setEditingPerson] = useState<any>(null)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [showPersonDialog, setShowPersonDialog] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const [gRes, pRes] = await Promise.all([
      fetch('/api/sales/groups'),
      fetch('/api/sales/persons'),
    ])
    const gData = await gRes.json()
    const pData = await pRes.json()
    setGroups(gData.groups ?? [])
    setPersons(pData.persons ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const saveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = Object.fromEntries(new FormData(form))
    if (editingGroup) {
      await fetch(`/api/sales/groups/${editingGroup.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    } else {
      await fetch('/api/sales/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setShowGroupDialog(false)
    setEditingGroup(null)
    loadData()
  }

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this group?')) return
    await fetch(`/api/sales/groups/${id}`, { method: 'DELETE' })
    loadData()
  }

  const savePerson = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = Object.fromEntries(new FormData(form))
    if (editingPerson) {
      await fetch(`/api/sales/persons/${editingPerson.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, commissionRate: Number(data.commissionRate) }) })
    } else {
      await fetch('/api/sales/persons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, commissionRate: Number(data.commissionRate) }) })
    }
    setShowPersonDialog(false)
    setEditingPerson(null)
    loadData()
  }

  const deletePerson = async (id: string) => {
    if (!confirm('Delete this person?')) return
    await fetch(`/api/sales/persons/${id}`, { method: 'DELETE' })
    loadData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Sales Persons & Groups</h1><p className="text-sm text-muted-foreground mt-1">Manage sales teams, commissions, and groupings</p></div>

      <Tabs defaultValue="persons">
        <TabsList>
          <TabsTrigger value="persons">Persons</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="persons" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showPersonDialog && !editingPerson} onOpenChange={(o) => { setShowPersonDialog(o); if (!o) setEditingPerson(null) }}>
              <DialogTrigger render={<Button />}><Plus className="w-4 h-4 mr-2" /> Add Person</DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingPerson ? 'Edit' : 'New'} Sales Person</DialogTitle></DialogHeader>
                <form onSubmit={savePerson} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input name="name" defaultValue={editingPerson?.name} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input name="email" type="email" defaultValue={editingPerson?.email} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input name="phone" defaultValue={editingPerson?.phone} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commission Rate (%)</Label>
                      <Input name="commissionRate" type="number" step="0.01" defaultValue={editingPerson?.commissionRate ?? 0} />
                    </div>
                    <div className="space-y-2">
                      <Label>Group</Label>
                      <Select name="groupId" defaultValue={editingPerson?.groupId || ''}>
                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowPersonDialog(false)}>Cancel</Button>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Commission</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {persons.map(p => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.email || '-'}</td>
                    <td className="p-3">{p.phone || '-'}</td>
                    <td className="p-3">{p.commissionRate}%</td>
                    <td className="p-3">{p.group?.name || '-'}</td>
                    <td className="p-3"><Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge></td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingPerson(p); setShowPersonDialog(true) }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deletePerson(p.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showGroupDialog && !editingGroup} onOpenChange={(o) => { setShowGroupDialog(o); if (!o) setEditingGroup(null) }}>
              <DialogTrigger render={<Button />}><Plus className="w-4 h-4 mr-2" /> Add Group</DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingGroup ? 'Edit' : 'New'} Sales Group</DialogTitle></DialogHeader>
                <form onSubmit={saveGroup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input name="name" defaultValue={editingGroup?.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input name="description" defaultValue={editingGroup?.description} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowGroupDialog(false)}>Cancel</Button>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {groups.map(g => (
              <Card key={g.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{g.name}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingGroup(g); setShowGroupDialog(true) }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteGroup(g.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{g.description || 'No description'}</p>
                <p className="text-xs text-muted-foreground">{g.salesPersons?.length || 0} persons</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
