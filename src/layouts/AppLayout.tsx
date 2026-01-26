import { WorkspaceProvider } from '@/context/WorkspaceContext'

import { useEffect, useState } from 'react'
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'
import {
    Inbox,
    Calendar,
    Users,
    Settings,
    LogOut,
    Bot,
    BarChart3,
    Menu,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { sendEscalationNotification } from '@/lib/notifications'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'

const navItems = [
    { to: '/inbox', label: 'Inbox', icon: Inbox },
    { to: '/insights', label: 'Insights', icon: BarChart3 },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/agents', label: 'Agent Hub', icon: Bot },
    { to: '/settings', label: 'Settings', icon: Settings },
]


export default function AppLayout() {
    const { session, loading, user } = useAuth()
    const [checkingWorkspace, setCheckingWorkspace] = useState(true)
    const [currentWorkspace, setCurrentWorkspace] = useState<Pick<Tables<'workspaces'>, 'id' | 'owner_id' | 'name'> | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const location = useLocation()

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location.pathname])

    // Map routes to titles
    const getPageTitle = (pathname: string) => {
        if (pathname.includes('/inbox')) return 'Inbox'
        if (pathname.includes('/insights')) return 'Insights'
        if (pathname.includes('/appointments')) return 'Appointments'
        if (pathname.includes('/contacts')) return 'Contacts'
        if (pathname.includes('/agents')) return 'Agent Hub'
        if (pathname.includes('/settings')) return 'Settings'
        return 'Overview'
    }

    useEffect(() => {
        let mounted = true

        const checkWorkspace = async () => {
            if (!user) {
                if (mounted) setCheckingWorkspace(false)
                return
            }

            try {
                const { data, error } = await supabase
                    .from('workspaces')
                    .select('id, owner_id, name')
                    .eq('owner_id', user.id)
                    .single()

                if (error) {
                    console.error('[AppLayout] Error fetching workspace:', error)
                    // Optionally surface error? For now just log.
                }

                if (data && mounted) {
                    setCurrentWorkspace(data)
                }
            } catch (err) {
                console.error('[AppLayout] Unexpected error:', err)
            } finally {
                if (mounted) setCheckingWorkspace(false)
            }
        }

        if (user) {
            checkWorkspace()
        } else if (!loading) {
            setCheckingWorkspace(false)
        }

        return () => {
            mounted = false
        }
    }, [user, loading])

    // --- REALTIME NOTIFICATIONS ---
    useEffect(() => {
        if (!user || !currentWorkspace) return

        const channel = supabase
            .channel('global-escalations')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `escalated=eq.true`
                },
                async (payload) => {
                    const newRecord = payload.new as Tables<'conversations'>
                    const oldRecord = payload.old as Tables<'conversations'>

                    if (!oldRecord?.escalated && newRecord.escalated) {
                        const { data: contact } = await supabase
                            .from('contacts')
                            .select('name, phone')
                            .eq('id', newRecord.contact_id)
                            .single()

                        const senderName = contact?.name || contact?.phone || 'Unknown Customer'
                        sendEscalationNotification(senderName, newRecord.id)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, currentWorkspace])

    if (loading || checkingWorkspace) {
        return <FlowCoreLoader fullScreen />
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    if (!currentWorkspace && !checkingWorkspace) {
        return <Navigate to="/onboarding" replace />
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
            {/* Background Grid Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-grid-small-black/[0.05] -z-10" />
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-md border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-white font-bold text-base">F</span>
                    </div>
                    <span className="font-semibold text-sm">{getPageTitle(location.pathname)}</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-expanded={mobileMenuOpen}
                    aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Mobile Slide-out Menu */}
            <div className={cn(
                "md:hidden fixed top-14 left-0 bottom-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-out",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <nav className="flex flex-col p-4 gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <item.icon className="h-5 w-5" strokeWidth={1.5} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                        <LogOut className="h-5 w-5" strokeWidth={1.5} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:flex z-20 w-[64px] flex-none border-r border-border/60 bg-card/80 backdrop-blur-md flex-col items-center py-4 gap-2">
                {/* Brand Logo */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/20 shrink-0">
                    <span className="text-white font-bold text-base">F</span>
                </div>

                {/* Navigation Icons */}
                <nav className="flex-1 flex flex-col gap-2 w-full px-2 items-center">
                    {navItems.map((item) => (
                        <div key={item.to} className="relative group flex items-center justify-center">
                            <NavLink
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) =>
                                    cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-100"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:scale-105"
                                    )
                                }
                            >
                                <item.icon className="h-5 w-5" strokeWidth={1.5} />
                            </NavLink>

                            {/* Hover Tooltip */}
                            <div className="absolute left-12 bg-popover text-popover-foreground text-[10px] font-medium px-2 py-1 rounded border shadow-md opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="mt-auto flex flex-col gap-2 w-full px-2 items-center">
                    <button
                        onClick={handleSignOut}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                        title="Sign Out"
                    >
                        <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={cn(
                "relative z-10 flex-1 flex flex-col bg-background/50",
                "pt-14 md:pt-0", // Add top padding on mobile for fixed header
                location.pathname.startsWith('/inbox') ? "overflow-hidden" : "overflow-auto"
            )}>
                {/* Desktop Header - Hidden for Inbox */}
                {!location.pathname.startsWith('/inbox') && (
                    <header className="hidden md:flex flex-none h-14 px-6 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground tracking-tight">
                                {currentWorkspace?.name || 'Loading...'}
                            </span>
                            <span className="text-border">/</span>
                            <span className="font-medium">{getPageTitle(location.pathname)}</span>
                        </div>
                    </header>
                )}

                <div className={cn(
                    "flex-1 duration-300",
                    location.pathname.startsWith('/inbox')
                        ? "p-0 overflow-hidden"
                        : "p-4 md:p-6 animate-in fade-in zoom-in-95"
                )}>
                    <WorkspaceProvider value={{ workspace: currentWorkspace, loading: checkingWorkspace }}>
                        <Outlet />
                    </WorkspaceProvider>
                </div>
            </main>
        </div>
    )
}

