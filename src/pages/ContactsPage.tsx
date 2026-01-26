import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Search,
    User,
    Plus,
    MoreHorizontal,
    Mail,
    Phone,
    MessageSquare
} from 'lucide-react'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'


import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface Contact {
    id: string
    name: string | null
    phone: string
    email: string | null
    channel: string | null
    tags: string[] | null
    metadata: any | null
    created_at: string | null
    workspace_id: string
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const { toast } = useToast()

    // Sheet State
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        tags: '',
        notes: ''
    })

    useEffect(() => {
        fetchContacts()
    }, [])

    const fetchContacts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: workspace } = await supabase
                .from('workspaces')
                .select('id')
                .eq('owner_id', user.id)
                .single()

            if (!workspace) return

            const { data } = await supabase
                .from('contacts')
                .select('*')
                .eq('workspace_id', workspace.id)
                .order('created_at', { ascending: false })

            if (data) setContacts(data)
        } catch (error) {
            console.error('Error fetching contacts:', error)
        } finally {
            setLoading(false)
        }
    }

    const openContact = (contact: Contact) => {
        setSelectedContact(contact)
        setFormData({
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            tags: contact.tags?.join(', ') || '',
            notes: contact.metadata?.notes || ''
        })
        setIsSheetOpen(true)
    }

    const openNew = () => {
        setSelectedContact(null)
        setFormData({
            name: '',
            email: '',
            phone: '',
            tags: '',
            notes: ''
        })
        setIsSheetOpen(true)
    }

    const handleSave = async () => {
        if (!formData.phone) {
            toast({ title: "Error", description: "Phone number is required", variant: "destructive" })
            return
        }

        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            const metadata = selectedContact?.metadata || {}
            metadata.notes = formData.notes

            const payload: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                tags: tagsArray,
                metadata: metadata
            }

            // Get workspace ID if new
            let wsId = selectedContact?.workspace_id
            if (!wsId) {
                const { data: { user } } = await supabase.auth.getUser()
                const { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).single()
                if (!workspace) throw new Error("Workspace not found")
                wsId = workspace.id
                payload.workspace_id = wsId
            }

            if (selectedContact?.id) {
                // Update
                const { error } = await supabase
                    .from('contacts')
                    .update(payload)
                    .eq('id', selectedContact.id)
                if (error) throw error
                toast({ title: "Updated", description: "Contact updated successfully." })
            } else {
                // Insert
                const { error } = await supabase
                    .from('contacts')
                    .insert(payload)
                if (error) throw error
                toast({ title: "Created", description: "Contact created successfully." })
            }

            setIsSheetOpen(false)
            fetchContacts()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const q = searchQuery.toLowerCase()
            const name = contact.name?.toLowerCase() || ''
            const phone = contact.phone?.toLowerCase() || ''
            const email = contact.email?.toLowerCase() || ''
            return name.includes(q) || phone.includes(q) || email.includes(q)
        })
    }, [contacts, searchQuery])

    if (loading) {
        return <FlowCoreLoader />
    }

    return (
        <div className="flex-1 h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Contacts</h1>
                    <p className="text-muted-foreground text-xs mt-1">Manage all your customer relationships.</p>
                </div>
                <Button size="sm" onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg gap-2 text-xs h-8">
                    <Plus className="h-3.5 w-3.5" />
                    New Contact
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-card/40 p-1 rounded-xl border border-border/40 backdrop-blur-sm max-w-sm ml-1">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, phone or email..."
                        className="pl-9 h-9 text-xs bg-transparent border-transparent focus:ring-0 placeholder:text-muted-foreground/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-border/50 bg-muted/20 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-4">Name & Channel</div>
                    <div className="col-span-4">Contact Details</div>
                    <div className="col-span-3">Tags</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                {/* Table Body */}
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                                <User className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No contacts yet</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mt-2">
                                Add your first contact to start managing relationships.
                            </p>
                            <Button className="mt-6 rounded-xl bg-primary hover:bg-primary/90" onClick={openNew}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Contact
                            </Button>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                                <Search className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No contacts found</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mt-2">
                                We couldn't find any contacts matching "{searchQuery}". Try a different search term.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-6 rounded-xl border-dashed"
                                onClick={() => setSearchQuery('')}
                            >
                                Clear Search
                            </Button>
                        </div>
                    ) : (
                        filteredContacts.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => openContact(contact)}
                                className="grid grid-cols-12 gap-3 px-4 py-2 items-center hover:bg-muted/30 transition-colors rounded-lg group border border-transparent hover:border-border/30 cursor-pointer"
                            >
                                {/* Name Column */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-white">
                                        {(contact.name?.[0] || contact.phone?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-xs text-foreground truncate">{contact.name || 'Unknown'}</p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                            {contact.channel === 'whatsapp' ? (
                                                <MessageSquare className="h-2.5 w-2.5 text-emerald-500" />
                                            ) : (
                                                <User className="h-2.5 w-2.5" />
                                            )}
                                            <span className="capitalize">{contact.channel || 'Manual'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Column */}
                                <div className="col-span-4 space-y-0.5">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3 opacity-60" />
                                        <span className="font-mono text-[10px]">{contact.phone}</span>
                                    </div>
                                    {contact.email && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail className="h-3 w-3 opacity-60" />
                                            <span className="truncate text-[10px]">{contact.email}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tags Column */}
                                <div className="col-span-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {contact.tags && contact.tags.length > 0 ? (
                                            contact.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50 shadow-sm">
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground/40 text-xs italic">No tags</span>
                                        )}
                                        {contact.tags && contact.tags.length > 2 && (
                                            <span className="text-xs text-muted-foreground px-1">+{contact.tags.length - 2}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Column */}
                                <div className="col-span-1 flex justify-end">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>{selectedContact ? 'Edit Contact' : 'New Contact'}</SheetTitle>
                        <SheetDescription>
                            Update contact details, tags, and internal notes.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+1234567890"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Tags (comma separated)</Label>
                            <Input
                                value={formData.tags}
                                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                placeholder="VIP, Lead, Interested"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Internal Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add notes about specific preferences or history..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}
