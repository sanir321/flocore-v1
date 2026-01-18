import { useEffect, useState } from 'react'
import { Outlet, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
    LayoutDashboard,
    Inbox,
    Calendar,
    Users,
    Settings,
    LogOut,
    Bot
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inbox', label: 'Inbox', icon: Inbox },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/agents', label: 'Agent Hub', icon: Bot },
    { to: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout() {
    const { session, loading, user } = useAuth()
    const [checkingWorkspace, setCheckingWorkspace] = useState(true)
    const [hasWorkspace, setHasWorkspace] = useState(false)

    useEffect(() => {
        const checkWorkspace = async () => {
            if (!user) {
                setCheckingWorkspace(false)
                return
            }

            const { data } = await supabase
                .from('workspaces')
                .select('id')
                .eq('owner_id', user.id)
                .single()

            setHasWorkspace(!!data)
            setCheckingWorkspace(false)
        }

        if (user) {
            checkWorkspace()
        } else if (!loading) {
            setCheckingWorkspace(false)
        }
    }, [user, loading])

    // --- REALTIME NOTIFICATIONS ---
    useEffect(() => {
        if (!user || !hasWorkspace) return

        const channel = supabase
            .channel('global-escalations')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `escalated=eq.true` // Listen for any escalated conversation
                },
                async (payload) => {
                    const newRecord = payload.new as any
                    const oldRecord = payload.old as any

                    // Only trigger if it wasn't escalated before (avoid dupes)
                    if (!oldRecord?.escalated && newRecord.escalated) {
                        console.log('Received escalation event:', newRecord)

                        // Fetch contact name for better notification
                        const { data: contact } = await supabase
                            .from('contacts')
                            .select('name, phone')
                            .eq('id', newRecord.contact_id)
                            .single()

                        const senderName = contact?.name || contact?.phone || 'Unknown Customer'

                        // Use the imported notification helper
                        // We use dynamic import or ensure valid imports above
                        // Assuming sendEscalationNotification is imported from @/lib/notifications
                        const { sendEscalationNotification } = await import('@/lib/notifications')
                        sendEscalationNotification(senderName, newRecord.id)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, hasWorkspace])

    if (loading || checkingWorkspace) {
        return <FlowCoreLoader fullScreen />
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    if (!hasWorkspace) {
        return <Navigate to="/onboarding" replace />
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Icon Rail (Slim vertical bar) */}
            <aside className="w-16 flex-none border-r bg-card flex flex-col items-center py-4">
                {/* Logo */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-6">
                    <span className="text-white font-bold text-sm">F</span>
                </div>

                {/* Navigation Icons */}
                <nav className="flex-1 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                                    isActive
                                        ? "bg-secondary text-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                            title={item.label}
                        >
                            <item.icon className="h-5 w-5" />
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="mt-auto flex flex-col gap-2">
                    <button
                        onClick={handleSignOut}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}
