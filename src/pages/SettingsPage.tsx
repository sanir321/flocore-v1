import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Bell, User, Calendar, MessageSquare, Mail, Smartphone, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
    const location = useLocation()
    const isSubRoute = location.pathname !== '/settings' && location.pathname !== '/settings/'

    return (
        <div className="flex h-full bg-background">
            {/* Settings Sidebar - Mobile: Visible only when NOT in sub-route. Desktop: Always visible */}
            <div className={cn(
                "w-full md:w-64 border-r bg-muted/10 flex-col md:flex",
                isSubRoute ? "hidden" : "flex"
            )}>
                <div className="p-6">
                    <h2 className="font-bold text-lg tracking-tight">Settings</h2>
                    <p className="text-xs text-muted-foreground mt-1">Manage your workspace</p>
                </div>

                <nav className="flex-1 px-4 space-y-6 overflow-auto">
                    {/* Account Section */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Account</p>
                        <NavLink
                            to="/settings/profile"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-3 md:py-2 rounded-md transition-all duration-200 text-sm font-medium",
                                    isActive
                                        ? "bg-white text-primary shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )
                            }
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </NavLink>
                        <NavLink
                            to="/settings/notifications"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-3 md:py-2 rounded-md transition-all duration-200 text-sm font-medium",
                                    isActive
                                        ? "bg-white text-primary shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )
                            }
                        >
                            <Bell className="h-4 w-4" />
                            Notifications
                        </NavLink>
                    </div>

                    {/* Channels Section */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Channels</p>
                        <NavLink
                            to="/settings/whatsapp"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-3 md:py-2 rounded-md transition-all duration-200 text-sm font-medium",
                                    isActive
                                        ? "bg-white text-primary shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )
                            }
                        >
                            <MessageSquare className="h-4 w-4" />
                            WhatsApp
                        </NavLink>

                        {/* Coming Soon Items */}
                        <div className="flex items-center gap-3 px-3 py-3 md:py-2 text-muted-foreground/40 cursor-not-allowed select-none text-sm">
                            <Mail className="h-4 w-4" />
                            Email
                        </div>
                        <div className="flex items-center gap-3 px-3 py-3 md:py-2 text-muted-foreground/40 cursor-not-allowed select-none text-sm">
                            <Smartphone className="h-4 w-4" />
                            SMS
                        </div>
                    </div>

                    {/* Integrations Section */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Integrations</p>
                        <NavLink
                            to="/settings/calendar"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-3 md:py-2 rounded-md transition-all duration-200 text-sm font-medium",
                                    isActive
                                        ? "bg-white text-primary shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )
                            }
                        >
                            <Calendar className="h-4 w-4" />
                            Calendar
                        </NavLink>
                    </div>
                </nav>
            </div>

            {/* Main Content - Mobile: Visible only in sub-route. Desktop: Always visible */}
            <div className={cn(
                "flex-1 overflow-auto bg-slate-50/50",
                isSubRoute ? "flex flex-col" : "hidden md:flex"
            )}>
                {isSubRoute ? (
                    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500 slide-in-from-bottom-2">
                        {/* Mobile Back Button */}
                        <div className="md:hidden mb-4">
                            <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                                <NavLink to="/settings">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Settings
                                </NavLink>
                            </Button>
                        </div>
                        <Outlet />
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center p-8">
                        <div className="text-center max-w-sm">
                            <div className="w-16 h-16 rounded-full border bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <User className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2 text-foreground">Workspace Settings</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Select a category from the sidebar to manage your account, notifications, and integrations.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

