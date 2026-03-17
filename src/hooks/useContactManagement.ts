import { useState, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useContacts } from '@/hooks/queries/useContacts'

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

export function useContactManagement() {
    const { contacts, isLoading: loading, upsertContact } = useContacts()
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
            const metadata = { ...(selectedContact?.metadata as any || {}), notes: formData.notes }

            await upsertContact({
                ...(selectedContact?.id ? { id: selectedContact.id } : {}),
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                tags: tagsArray,
                metadata: metadata
            })

            toast({ 
                title: selectedContact ? "Updated" : "Created", 
                description: `Contact ${selectedContact ? 'updated' : 'created'} successfully.` 
            })
            setIsSheetOpen(false)
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

    return {
        contacts,
        loading,
        searchQuery,
        setSearchQuery,
        selectedContact,
        isSheetOpen,
        setIsSheetOpen,
        formData,
        setFormData,
        openContact,
        openNew,
        handleSave,
        filteredContacts
    }
}
