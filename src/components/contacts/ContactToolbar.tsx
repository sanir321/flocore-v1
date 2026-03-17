import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ContactToolbarProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    onNewContact: () => void
}

export function ContactToolbar({ searchQuery, setSearchQuery, onNewContact }: ContactToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Contacts</h1>
                <p className="text-muted-foreground text-xs mt-1">Manage all your customer relationships.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-card/40 p-1 rounded-xl border border-border/40 backdrop-blur-sm flex-1 sm:w-64">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            id="contacts-search"
                            placeholder="Search contacts..."
                            className="pl-9 h-9 text-xs bg-transparent border-transparent focus:ring-0 placeholder:text-muted-foreground/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search contacts"
                        />
                    </div>
                </div>
                <Button 
                    size="sm" 
                    onClick={onNewContact} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg gap-2 text-xs h-9 px-4"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">New Contact</span>
                    <span className="sm:hidden">New</span>
                </Button>
            </div>
        </div>
    )
}
