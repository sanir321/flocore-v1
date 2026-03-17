import { User, Search, Plus, MoreHorizontal, Mail, Phone, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface ContactListProps {
    contacts: Contact[]
    filteredContacts: Contact[]
    onContactClick: (contact: Contact) => void
    onNewContact: () => void
    searchQuery: string
    setSearchQuery: (query: string) => void
}

export function ContactList({
    contacts,
    filteredContacts,
    onContactClick,
    onNewContact,
    searchQuery,
    setSearchQuery
}: ContactListProps) {
    if (contacts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                    <User className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No contacts yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-2">
                    Add your first contact to start managing relationships.
                </p>
                <Button className="mt-6 rounded-xl bg-primary hover:bg-primary/90" onClick={onNewContact}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Contact
                </Button>
            </div>
        )
    }

    if (filteredContacts.length === 0) {
        return (
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
        )
    }

    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-border/50 bg-muted/20 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-8 md:col-span-4">Name & Channel</div>
                <div className="hidden md:block md:col-span-4">Contact Details</div>
                <div className="hidden md:block md:col-span-3">Tags</div>
                <div className="col-span-4 md:col-span-1 text-right">Action</div>
            </div>

            {/* Table Body */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {filteredContacts.map(contact => (
                    <div
                        key={contact.id}
                        onClick={() => onContactClick(contact)}
                        className="grid grid-cols-12 gap-3 px-4 py-2 items-center hover:bg-muted/30 transition-colors rounded-lg group border border-transparent hover:border-border/30 cursor-pointer"
                    >
                        {/* Name Column */}
                        <div className="col-span-8 md:col-span-4 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-100 to-teal-100 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-white">
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
                        <div className="hidden md:block md:col-span-4 space-y-0.5">
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
                        <div className="hidden md:block md:col-span-3">
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
                        <div className="col-span-4 md:col-span-1 flex justify-end">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                aria-label={`More actions for contact ${contact.name || contact.phone}`}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
