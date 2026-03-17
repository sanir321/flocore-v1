import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Appointment {
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

export function useAppointments(workspaceId: string | undefined) {
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ['appointments', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return []
            const { data, error } = await supabase
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
                .eq('workspace_id', workspaceId)
                .order('start_time', { ascending: true })

            if (error) throw error
            return data as any as Appointment[]
        },
        enabled: !!workspaceId
    })

    const cancelMutation = useMutation({
        mutationFn: async (appointmentId: string) => {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', appointmentId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments', workspaceId] })
        }
    })

    return {
        appointments: query.data || [],
        isLoading: query.isLoading,
        cancelAppointment: cancelMutation.mutateAsync,
        isCancelling: cancelMutation.isPending
    }
}
