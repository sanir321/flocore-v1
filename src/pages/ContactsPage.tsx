import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Search,
    User,
    Plus,
    MoreHorizontal,
    Mail,
    Phone,
    MessageSquare,
    Tag
} from 'lucide-react'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'

interface Contact {
    id: string
    name: string | null
    phone: string
    email: string | null
    channel: string | null
    tags: string[] | null
    created_at: string | null
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

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
        <div className="flex-1 h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex-none bg-white border-b px-8 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage all your customer relationships</p>
                </div>
                <Button className="bg-primary text-white gap-2 rounded-xl" disabled>
                    <Plus className="h-4 w-4" />
                    Add Contact
                </Button>
            </div>

            {/* Toolbar */}
            <div className="px-8 py-4 flex items-center justify-between gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search contacts..."
                        className="pl-9 h-10 bg-white border-slate-200 rounded-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="text-sm text-slate-500">
                    Showing <span className="font-medium text-slate-900">{filteredContacts.length}</span> contacts
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto px-8 pb-8">
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Tags</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No contacts found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map(contact => (
                                    <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                    {(contact.name?.[0] || contact.phone?.[0] || '?')}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{contact.name || 'Unknown'}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={Object.is(contact.channel, 'whatsapp') ? "text-emerald-600" : "text-slate-400"}>
                                                            {contact.channel === 'whatsapp' ? <MessageSquare className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                                        </span>
                                                        <span className="text-xs text-slate-500 capitalize">{contact.channel || 'Manual'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone className="h-3 w-3 text-slate-400" />
                                                    <span>{contact.phone}</span>
                                                </div>
                                                {contact.email && (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        <span>{contact.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {contact.tags && contact.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {contact.tags.map(tag => (
                                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                                            <Tag className="h-2.5 w-2.5 opacity-50" />
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">No tags</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {contact.created_at ? format(new Date(contact.created_at), 'MMM d, yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
