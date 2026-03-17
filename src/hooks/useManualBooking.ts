import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

export function useManualBooking(workspaceId: string | undefined) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const { toast } = useToast()
    const queryClient = useQueryClient()

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
                const { data: newContact, error: createError } = await supabase
                    .from('contacts')
                    .insert({
                        workspace_id: workspaceId,
                        name: title.split(' ')?.[0] || 'Unknown',
                        email: email || null,
                        phone: phone || `manual_${Date.now()}`,
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
                booked_by: 'human',
                metadata: { duration_minutes: duration },
                contact_id: contactId,
            } as any)

            if (apptError) throw apptError

            toast({ title: "Success", description: "Appointment added manually." })
            setIsAddOpen(false)
            queryClient.invalidateQueries({ queryKey: ['appointments', workspaceId] })
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    return {
        isAddOpen,
        setIsAddOpen,
        handleManualAdd
    }
}
