import { useEffect, useState } from 'react'
import { useWorkspace } from '@/context/WorkspaceContext'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Calendar as CalendarIcon,
    Link as LinkIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    List,
    Filter,
    X
} from 'lucide-react'
import {
    format,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameDay,
    parseISO,
    addWeeks,
    subWeeks,
    getHours,
    getMinutes
} from 'date-fns'
import { sendBookingNotification } from '@/lib/notifications'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'

interface Appointment {
    id: string
    title: string
    description: string | null
    scheduled_at: string
    duration_minutes: number
    status: string
    google_event_id: string | null
    contact: {
        name: string | null
        phone: string
        email: string | null
    } | null
}

interface Member {
    id: string
    name: string
}

type ViewMode = 'list' | 'calendar'

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [view, setView] = useState<ViewMode>('list')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [members, setMembers] = useState<Member[]>([])
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
    const [filterShow, setFilterShow] = useState('All')
    const { toast } = useToast()
    const { workspace, loading: workspaceLoading } = useWorkspace()

    // --- 1. DATA FETCHING ---
    useEffect(() => {
        if (!workspace || workspaceLoading) return

        const fetchInitialData = async () => {
            setWorkspaceId(workspace.id)

            // Get Members (Owner + Workspace Members)
            // Ideally join profiles, but simplified for now: Owner + AI
            // If we had a generic 'members' list, we'd fetch it here.
            // For now, let's treat the owner as the primary member.
            // Get Members (Owner + Workspace Members)
            // Simplified: Owner + AI
            const { data: { user } } = await supabase.auth.getUser()

            const ownerMember = {
                id: workspace.owner_id,
                name: user?.user_metadata?.full_name || user?.email || 'Me'
            }
            const aiMember = { id: 'ai', name: 'AI Agent' }

            const initialMembers = [ownerMember, aiMember]
            setMembers(initialMembers)
            setSelectedMembers(initialMembers.map(m => m.id)) // Select all by default

            // Fetch Appointments
            await refreshAppointments(workspace.id)
            setLoading(false)
        }

        fetchInitialData()

        // Real-time subscription for new bookings
        const channel = supabase
            .channel('appointments-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'appointments',
                filter: `workspace_id=eq.${workspace.id}`
            },
                (payload) => {
                    // Refresh the list
                    refreshAppointments(workspace.id)

                    // Send notification
                    const newAppt = payload.new as any
                    const prefs = localStorage.getItem(`notification_settings_${workspace.id}`)
                    const settings = prefs ? JSON.parse(prefs) : { booking_confirmations: true }
                    if (settings.booking_confirmations) {
                        const dateStr = newAppt.start_time
                            ? format(new Date(newAppt.start_time), 'MMM d, h:mm a')
                            : 'Scheduled'
                        sendBookingNotification('New Customer', dateStr, newAppt.id)
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [workspace, workspaceLoading])

    const refreshAppointments = async (wsId: string) => {
        const { data } = await supabase
            .from('appointments')
            .select(`
                id,
                title,
                description:notes,
                scheduled_at:start_time,
                duration_minutes:metadata->duration_minutes,
                status,
                booked_by:booked_by,
                google_event_id,
                contact:contacts(name, phone, email)
            `)
            .eq('workspace_id', wsId)
            // .neq('status', 'cancelled') // Cancelled are kept for list filtering
            .order('start_time', { ascending: true })

        if (data) {
            setAppointments(data as any as Appointment[])
        }
        setLoading(false)
    }

    // --- 2. ACTIONS ---
    const handleManualAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!workspaceId) return

        const formData = new FormData(e.target as HTMLFormElement)
        const date = formData.get('date') as string
        const time = formData.get('time') as string
        const title = formData.get('title') as string
        const duration = parseInt(formData.get('duration') as string) || 60
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string

        if (!date || !time || !title) return

        try {
            const startDateTime = new Date(`${date}T${time}`).toISOString()

            // 1. Find or Create Contact
            let contactId = null

            // Try to find by email or phone
            let query = supabase.from('contacts').select('id').eq('workspace_id', workspaceId)

            if (email) {
                query = query.eq('email', email)
            } else if (phone) {
                query = query.eq('phone', phone)
            }

            const { data: existingContacts } = await query.limit(1)

            if (existingContacts && existingContacts.length > 0) {
                contactId = existingContacts[0].id
            } else {
                // Create new contact
                const { data: newContact, error: createError } = await supabase
                    .from('contacts')
                    .insert({
                        workspace_id: workspaceId,
                        name: title.split(' ')?.[0] || 'Unknown', // Rough guess at name from title if needed
                        email: email || null,
                        phone: phone || `manual_${Date.now()}`, // Fallback if no phone provided
                        channel: 'manual',
                        created_at: new Date().toISOString()
                    })
                    .select('id')
                    .single()

                if (createError) throw createError
                contactId = newContact.id
            }

            // 2. Create Appointment
            const { error: apptError } = await supabase.from('appointments').insert({
                workspace_id: workspaceId,
                title,
                start_time: startDateTime,
                end_time: new Date(new Date(startDateTime).getTime() + duration * 60000).toISOString(),
                status: 'booked',
                booked_by: 'human', // Manual
                metadata: { duration_minutes: duration },
                contact_id: contactId,
            } as any)

            if (apptError) throw apptError

            toast({ title: "Success", description: "Appointment added manually." })
            setIsAddOpen(false)
            await refreshAppointments(workspaceId)
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    const handleCopyLink = () => {
        const link = window.location.origin + `/book/${workspaceId}`
        navigator.clipboard.writeText(link)
            .then(() => toast({ title: "Copied", description: "Booking link copied to clipboard." }))
            .catch(() => toast({ title: "Error", description: "Failed to copy link", variant: "destructive" }))
    }

    const handleCancel = async (appointment: Appointment) => {
        if (!workspaceId) return

        try {
            // Optimistic Update
            setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, status: 'cancelled' } : a))

            // Cancel on Google if needed
            if (appointment.google_event_id) {
                await api.calendarAction({
                    action: 'cancel_appointment',
                    workspace_id: workspaceId,
                    params: { event_id: appointment.google_event_id }
                })
            } else {
                // Local Cancel Only
                await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointment.id)
            }
            toast({ title: "Cancelled", description: "Appointment cancelled successfully." })

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
            // Rollback
            refreshAppointments(workspaceId)
        }
    }

    // --- 3. FILTER LOGIC ---
    const filteredAppointments = appointments.filter(apt => {
        // Filter by Member (booked_by logic)
        const bookerId = (apt as any).booked_by === 'ai' ? 'ai' : (workspace?.owner_id || '')

        // Filter Logic
        const matchesMember = selectedMembers.includes(bookerId) || ((apt as any).booked_by === 'human' && selectedMembers.some(m => m !== 'ai'))
        const matchesStatus = filterShow === 'All' ? true : (filterShow === 'Upcoming' ? apt.status !== 'cancelled' : apt.status === 'cancelled')

        return matchesMember && matchesStatus
    })

    if (loading) return <FlowCoreLoader />

    return (
        <div className="flex h-full overflow-hidden bg-background relative">
            {/* MOBILE FILTER TOGGLE */}
            <div className="md:hidden absolute top-4 left-4 z-20">
                <Button variant="outline" size="sm" onClick={() => setMobileFiltersOpen(true)} className="gap-2 bg-background/95 backdrop-blur">
                    <Filter className="h-4 w-4" /> Filters
                </Button>
            </div>

            {/* SIDEBAR OVERLAY */}
            {mobileFiltersOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
            )}

            {/* SIDEBAR */}
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
                    <h2 className="text-lg font-semibold mb-4 hidden md:block">Appointments</h2>
                    <div className="flex flex-col gap-1">
                        <Button variant={view === 'list' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => { setView('list'); setMobileFiltersOpen(false); }}>
                            <List className="h-4 w-4 mr-2" /> Appointments
                        </Button>
                        <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => { setView('calendar'); setMobileFiltersOpen(false); }}>
                            <CalendarIcon className="h-4 w-4 mr-2" /> Calendar
                        </Button>
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Filter by member</h3>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="all"
                                checked={selectedMembers.length === members.length}
                                onCheckedChange={(c) => setSelectedMembers(c ? members.map(m => m.id) : [])}
                            />
                            <label htmlFor="all" className="text-sm font-medium">Select all</label>
                        </div>
                        {members.map(m => (
                            <div key={m.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={m.id}
                                    checked={selectedMembers.includes(m.id)}
                                    // Toggle logic
                                    onCheckedChange={(c) => {
                                        if (c) setSelectedMembers([...selectedMembers, m.id])
                                        else setSelectedMembers(selectedMembers.filter(id => id !== m.id))
                                    }}
                                />
                                <label htmlFor={m.id} className="text-sm">{m.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {view === 'list' ? (
                    <AppointmentsListView
                        appointments={filteredAppointments}
                        handleCancel={handleCancel}
                        handleCopyLink={handleCopyLink}
                        openAddModal={() => setIsAddOpen(true)}
                        filterShow={filterShow}
                        setFilterShow={setFilterShow}
                    />
                ) : (
                    <AppointmentsCalendarView
                        appointments={filteredAppointments}
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                    />
                )}
            </div>

            {/* ADD MODAL */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Manual Appointment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleManualAdd} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input name="time" type="time" required defaultValue="09:00" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input name="title" placeholder="Meeting with client" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Email (Optional)</Label>
                            <Input name="email" type="email" placeholder="client@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone (Optional)</Label>
                            <Input name="phone" type="tel" placeholder="+1234567890" />
                        </div>
                        <div className="space-y-2">
                            <Label>Duration (Min)</Label>
                            <Input name="duration" type="number" defaultValue="60" />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Appointment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function AppointmentsListView({ appointments, handleCancel, handleCopyLink, openAddModal, filterShow, setFilterShow }: any) {
    return (
        <div className="p-4 md:p-8 h-full overflow-auto pt-16 md:pt-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Appointments</h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        <LinkIcon className="h-4 w-4 mr-2" /> Copy link
                    </Button>
                    <Button size="sm" onClick={openAddModal}>
                        <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                </div>
            </div>
            {/* ... Filters Bar & List (same as before) ... */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <span className="text-muted-foreground">Show</span>
                <select
                    className="border rounded px-2 py-1 bg-background text-sm"
                    value={filterShow}
                    onChange={(e) => setFilterShow(e.target.value)}
                    aria-label="Show appointments"
                >
                    <option value="All">All</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <span className="text-muted-foreground ml-2">during</span>
                <button className="border rounded px-3 py-1 bg-background text-sm">
                    {format(new Date(), 'MMM d, yyyy')} - {format(addDays(new Date(), 7), 'MMM d, yyyy')}
                </button>
            </div>

            {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-card/50">
                    <CalendarIcon className="h-8 w-8 text-primary/50 mb-4" />
                    <h3 className="text-lg font-semibold">No appointments found.</h3>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((apt: any) => (
                        <Card key={apt.id} className={apt.status === 'cancelled' ? 'opacity-60 bg-muted/30' : ''}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-md"><CalendarIcon className="h-5 w-5 text-primary" /></div>
                                    <div>
                                        <div className="font-semibold">{apt.title || 'Untitled'} {apt.status === 'cancelled' && '(Cancelled)'}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {format(parseISO(apt.scheduled_at), 'MMM d, h:mm a')} ({apt.duration_minutes}m)
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {apt.status !== 'cancelled' && <Button variant="ghost" className="text-destructive h-8" onClick={() => handleCancel(apt)}>Cancel</Button>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function AppointmentsCalendarView({ appointments, currentDate, setCurrentDate }: any) {
    // Re-use previous pure component logic (omitted for brevity in prompt updates, will deploy full)
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 })
    const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 0 })
    const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i))
    const hours = Array.from({ length: 11 }).map((_, i) => i + 8)

    const weekAppointments = appointments.filter((apt: any) => {
        if (apt.status === 'cancelled') return false
        const date = parseISO(apt.scheduled_at)
        return date >= startOfCurrentWeek && date <= endOfCurrentWeek
    })

    const getAppointmentStyle = (apt: any) => {
        const start = parseISO(apt.scheduled_at)
        const hour = getHours(start)
        const minutes = getMinutes(start)
        const top = (hour - 8) * 60 + minutes
        return { top: `${top}px`, height: `${apt.duration_minutes}px`, left: '2px', right: '2px' }
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Calendar</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{format(startOfCurrentWeek, 'MMM d')} - {format(endOfCurrentWeek, 'MMM d')}</span>
                    <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-8 min-w-[800px]">
                    <div className="border-b border-r py-2"></div>
                    {days.map(d => <div key={d.toISOString()} className="border-b border-r py-3 text-center sticky top-0 bg-white z-10">{format(d, 'EEE d')}</div>)}
                    {hours.map(h => (
                        <div key={h} className="contents">
                            <div className="border-r border-b h-[60px] text-xs text-right pr-2 pt-2">{h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</div>
                            {days.map(d => (
                                <div key={d.toISOString() + h} className="border-r border-b h-[60px] relative">
                                    {weekAppointments.filter((a: any) => isSameDay(parseISO(a.scheduled_at), d) && getHours(parseISO(a.scheduled_at)) === h).map((a: any) => (
                                        <div key={a.id} className="absolute bg-primary/10 border-l-4 border-primary rounded-r text-xs p-1 overflow-hidden z-10" style={getAppointmentStyle(a)}>
                                            {a.title}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
