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
    List
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
            const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('id', workspace.owner_id).single()

            const ownerMember = { id: profile?.id || workspace.owner_id, name: profile?.full_name || 'Me' }
            const aiMember = { id: 'ai', name: 'AI Agent' } // Special ID for AI bookings

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
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' },
                (payload) => {
                    // Refresh the list
                    if (workspace.id) refreshAppointments(workspace.id)

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
                booked_by,
                google_event_id,
                contact:contacts(name, phone, email)
            `)
            .eq('workspace_id', wsId)
            .neq('status', 'cancelled') // Assuming we hide cancelled by default or filter differently? 
            // Actually, keep cancelled for list view filtering
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

        if (!date || !time || !title) return

        try {
            const startDateTime = new Date(`${date}T${time}`).toISOString()

            // Insert into Supabase directly (Manual Entry)
            const { error } = await supabase.from('appointments').insert({
                workspace_id: workspaceId,
                title,
                start_time: startDateTime,
                end_time: new Date(new Date(startDateTime).getTime() + duration * 60000).toISOString(),
                status: 'booked',
                booked_by: 'human', // Manual
                metadata: { duration_minutes: duration },
                contact_id: '00000000-0000-0000-0000-000000000000', // Placeholder for type check
                // Note: We aren't creating a contact here yet to keep it simple, 
                // but real app should find/create contact by email.
            } as any)

            if (error) throw error

            toast({ title: "Success", description: "Appointment added manually." })
            setIsAddOpen(false)
            await refreshAppointments(workspaceId)
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    const handleCopyLink = () => {
        // Generate a simple message or link
        const link = `https://cal.com/book/${workspaceId}` // Placeholder or use real public page if exists
        navigator.clipboard.writeText(link)
        toast({ title: "Copied", description: "Booking link copied to clipboard." })
    }

    const handleCancel = async (appointment: Appointment) => {
        if (!appointment.google_event_id || !workspaceId) return

        try {
            const { error } = await api.calendarAction({
                action: 'cancel_appointment',
                workspace_id: workspaceId,
                params: { event_id: appointment.google_event_id }
            })

            if (!error) {
                toast({ title: "Cancelled", description: "Appointment cancelled successfully." })
                setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, status: 'cancelled' } : a))
            } else {
                throw new Error('Failed to cancel')
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    // --- 3. FILTER LOGIC ---
    const filteredAppointments = appointments.filter(apt => {
        // Filter by Member (booked_by logic)
        // If 'human' -> Owner (me). If 'ai' -> AI Agent.
        const bookerId = (apt as any).booked_by === 'ai' ? 'ai' : members[0]?.id // Fallback to owner for 'human'

        // If we don't strictly track booker -> owner ID, we approximate.
        return selectedMembers.includes(bookerId) || selectedMembers.includes('me') // Loose logic: Show all if 'me' is selected for manual ones
    })

    if (loading) return <FlowCoreLoader />

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* SIDEBAR */}
            <div className="w-64 border-r p-6 flex flex-col gap-6 bg-card/30">
                <div>
                    <h2 className="text-lg font-semibold mb-4">Appointments</h2>
                    <div className="flex flex-col gap-1">
                        <Button variant={view === 'list' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => setView('list')}>
                            <List className="h-4 w-4 mr-2" /> Appointments
                        </Button>
                        <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => setView('calendar')}>
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

function AppointmentsListView({ appointments, handleCancel, handleCopyLink, openAddModal }: any) {
    return (
        <div className="p-8 h-full overflow-auto">
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
                <select className="border rounded px-2 py-1 bg-background text-sm">
                    <option>All</option>
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
                        <>
                            <div key={h} className="border-r border-b h-[60px] text-xs text-right pr-2 pt-2">{h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</div>
                            {days.map(d => (
                                <div key={d.toISOString() + h} className="border-r border-b h-[60px] relative">
                                    {weekAppointments.filter((a: any) => isSameDay(parseISO(a.scheduled_at), d) && getHours(parseISO(a.scheduled_at)) === h).map((a: any) => (
                                        <div key={a.id} className="absolute bg-primary/10 border-l-4 border-primary rounded-r text-xs p-1 overflow-hidden z-10" style={getAppointmentStyle(a)}>
                                            {a.title}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </>
                    ))}
                </div>
            </div>
        </div>
    )
}
