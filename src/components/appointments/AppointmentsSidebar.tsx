import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, User, Calendar as CalendarIcon } from 'lucide-react'

interface Member {
    id: string
    name: string
}

type ViewMode = 'list' | 'calendar'

interface AppointmentsSidebarProps {
    view: ViewMode
    setView: (view: ViewMode) => void
    members: Member[]
    selectedMembers: string[]
    setSelectedMembers: (members: string[]) => void
    mobileFiltersOpen: boolean
    setMobileFiltersOpen: (open: boolean) => void
}

export function AppointmentsSidebar({
    view,
    setView,
    members,
    selectedMembers,
    setSelectedMembers,
    mobileFiltersOpen,
    setMobileFiltersOpen
}: AppointmentsSidebarProps) {
    return (
        <div className={`
            fixed md:static inset-y-0 left-0 z-40 w-64 bg-card/95 md:bg-card/30 border-r p-6 flex flex-col gap-6 transition-transform duration-300 ease-in-out
            ${mobileFiltersOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            <div className="flex items-center justify-between md:hidden mb-2">
                <span className="font-semibold">Filters & Views</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileFiltersOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4 hidden md:block px-2">Appointments</h2>
                <div className="flex flex-col gap-1">
                    <Button
                        variant={view === 'list' ? 'secondary' : 'ghost'}
                        className="justify-start text-sm font-medium h-10 w-full pl-3"
                        onClick={() => { setView('list'); setMobileFiltersOpen(false); }}
                    >
                        <User className="h-4 w-4 mr-3" /> Appointments
                    </Button>
                    <Button
                        variant={view === 'calendar' ? 'secondary' : 'ghost'}
                        className="justify-start text-sm font-medium h-10 w-full pl-3"
                        onClick={() => { setView('calendar'); setMobileFiltersOpen(false); }}
                    >
                        <CalendarIcon className="h-4 w-4 mr-3" /> Calendar
                    </Button>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Filter by member</h3>
                <div className="space-y-2 px-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="all"
                            checked={selectedMembers.length === members.length}
                            onCheckedChange={(c) => setSelectedMembers(c ? members.map(m => m.id) : [])}
                            aria-label="Select all members"
                        />
                        <label htmlFor="all" className="text-sm font-medium">Select all</label>
                    </div>
                    {members.map(m => (
                        <div key={m.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={m.id}
                                checked={selectedMembers.includes(m.id)}
                                onCheckedChange={(c) => {
                                    if (c) setSelectedMembers([...selectedMembers, m.id])
                                    else setSelectedMembers(selectedMembers.filter(id => id !== m.id))
                                }}
                                aria-label={`Select member ${m.name}`}
                            />
                            <label htmlFor={m.id} className="text-sm">{m.name}</label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
