import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
import { useContactManagement } from '@/hooks/useContactManagement'
import { ContactToolbar } from '@/components/contacts/ContactToolbar'
import { ContactList } from '@/components/contacts/ContactList'
import { ContactSheet } from '@/components/contacts/ContactSheet'

export default function ContactsPage() {
    const {
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
    } = useContactManagement()

    if (loading) {
        return <FlowCoreLoader />
    }

    return (
        <div className="flex-1 h-full flex flex-col space-y-6">
            <ContactToolbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNewContact={openNew}
            />

            <ContactList
                contacts={contacts}
                filteredContacts={filteredContacts}
                onContactClick={openContact}
                onNewContact={openNew}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <ContactSheet
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                selectedContact={selectedContact}
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
            />
        </div>
    )
}
