import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface OnlineUser {
    user_id: string
    online_at: string
    user_metadata?: {
        full_name?: string
        avatar_url?: string
    }
}

export function usePresence(workspaceId: string | undefined) {
    const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({})

    useEffect(() => {
        if (!workspaceId) return

        const channel = supabase.channel(`presence:workspace:${workspaceId}`)

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const formatted: Record<string, OnlineUser> = {}

                Object.keys(state).forEach((key) => {
                    const presence = state[key][0] as any
                    if (presence.user_id) {
                        formatted[presence.user_id] = {
                            user_id: presence.user_id,
                            online_at: presence.online_at,
                            user_metadata: presence.user_metadata
                        }
                    }
                })

                setOnlineUsers(formatted)
            })
            .on('presence', { event: 'join' }, () => {
                // User joined
            })
            .on('presence', { event: 'leave' }, () => {
                // User left
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const user = await supabase.auth.getUser()
                    if (user.data.user) {
                        await channel.track({
                            user_id: user.data.user.id,
                            online_at: new Date().toISOString(),
                            user_metadata: user.data.user.user_metadata
                        })
                    }
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId])

    const isUserOnline = (userId: string | undefined) => {
        if (!userId) return false
        return !!onlineUsers[userId]
    }

    return {
        onlineUsers,
        isUserOnline
    }
}
