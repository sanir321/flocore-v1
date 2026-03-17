import { useEffect, useState, useMemo } from 'react'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { useAppointments } from '@/hooks/queries/useAppointments'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
    Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { sendBookingNotification } from '@/lib/notifications'
import { secureStorage } from '@/lib/storage'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
import { AppointmentsListView } from '@/components/appointments/AppointmentsListView'
import { AppointmentsCalendarView } from '@/components/appointments/AppointmentsCalendarView'
import { AppointmentsSidebar } from '@/components/appointments/AppointmentsSidebar'
import { AddAppointmentModal } from '@/components/appointments/AddAppointmentModal'
import { useManualBooking } from '@/hooks/useManualBooking'

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
    const { data: workspace, isLoading: workspaceLoading } = useWorkspace()
    const workspaceId = workspace?.id
    const { appointments: appointmentsData, isLoading: appointmentsLoading } = useAppointments(workspaceId)
    
    const [view, setView] = useState<ViewMode>('list')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [members, setMembers] = useState<Member[]>([])
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
    const [filterShow, setFilterShow] = useState('All')
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const { 
        isAddOpen, 
        setIsAddOpen, 
        handleManualAdd 
    } = useManualBooking(workspaceId)

    // --- 1. DATA FETCHING ---
    const appointments = useMemo(() => appointmentsData || [], [appointmentsData])

    useEffect(() => {
        if (!workspace || workspaceLoading) return

        const fetchMembers = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            const ownerMember = {
                id: (workspace as any).owner_id as string,
                name: user?.user_metadata?.full_name || user?.email || 'Me'
            }
            const aiMember = { id: 'ai', name: 'AI Agent' }

            const initialMembers = [ownerMember, aiMember]
            setMembers(initialMembers)
            setSelectedMembers(initialMembers.map(m => m.id))
        }

        fetchMembers()

        const channel = supabase
            .channel('appointments-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'appointments',
                filter: `workspace_id=eq.${workspace.id}`
            },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['appointments', workspace.id] })

                    const newAppt = payload.new as any
                    const settings = secureStorage.getItem<any>(`notification_settings_${workspace.id}`) || { booking_confirmations: true }
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
    }, [workspace, workspaceLoading, queryClient])

    // --- 2. ACTIONS ---
    const handleCopyLink = () => {
        const link = window.location.origin + `/book/${workspaceId}`
        navigator.clipboard.writeText(link)
            .then(() => toast({ title: "Copied", description: "Booking link copied to clipboard." }))
            .catch(() => toast({ title: "Error", description: "Failed to copy link", variant: "destructive" }))
    }

    const handleCancel = async (appointment: Appointment) => {
        if (!workspaceId) return

        try {
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
            
            queryClient.invalidateQueries({ queryKey: ['appointments', workspaceId] })
            toast({ title: "Cancelled", description: "Appointment cancelled successfully." })

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
            queryClient.invalidateQueries({ queryKey: ['appointments', workspaceId] })
        }
    }

    // --- 3. FILTER LOGIC ---
    const filteredAppointments = appointments.filter(apt => {
        const bookerId = (apt as any).booked_by === 'ai' ? 'ai' : (workspace?.owner_id || '')
        const matchesMember = selectedMembers.includes(bookerId) || ((apt as any).booked_by === 'human' && selectedMembers.some(m => m !== 'ai'))
        const matchesStatus = filterShow === 'All' ? true : (filterShow === 'Upcoming' ? apt.status !== 'cancelled' : apt.status === 'cancelled')

        return matchesMember && matchesStatus
    })

    if (workspaceLoading || appointmentsLoading) return <FlowCoreLoader />

    return (
        <div className="flex h-full overflow-hidden bg-background relative">
            <div className="md:hidden absolute top-4 left-4 z-20">
                <Button variant="outline" size="sm" onClick={() => setMobileFiltersOpen(true)} className="gap-2 bg-background/95 backdrop-blur">
                    <Filter className="h-4 w-4" /> Filters
                </Button>
            </div>

            {mobileFiltersOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
            )}

            <AppointmentsSidebar
                view={view}
                setView={setView}
                members={members}
                selectedMembers={selectedMembers}
                setSelectedMembers={setSelectedMembers}
                mobileFiltersOpen={mobileFiltersOpen}
                setMobileFiltersOpen={setMobileFiltersOpen}
            />

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

            <AddAppointmentModal
                isOpen={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSubmit={handleManualAdd}
            />
        </div>
    )
}
