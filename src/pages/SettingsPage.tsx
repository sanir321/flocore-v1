import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MessageSquare, Calendar, ChevronRight, User, Bell, Mail, Smartphone } from 'lucide-react'

export default function SettingsPage() {
    const location = useLocation()
    const isSubRoute = location.pathname !== '/settings' && location.pathname !== '/settings/'

    return (
        <div className="flex h-full">
            {/* Settings Sidebar */}
            <div className="w-72 border-r bg-card flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-lg">Settings</h2>
                    <p className="text-xs text-muted-foreground mt-1">Configure your workspace</p>
                </div>

                <nav className="flex-1 p-3 space-y-4 overflow-auto">
                    {/* Account Section */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Account</p>
                        <NavLink
                            to="/settings/profile"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-secondary text-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-background transition-colors">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium">Profile</div>
                            </div>
                        </NavLink>
                        <NavLink
                            to="/settings/notifications"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-secondary text-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-background transition-colors">
                                <Bell className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium">Notifications</div>
                            </div>
                        </NavLink>
                    </div>

                    {/* Channels Section */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Channels</p>
                        <NavLink
                            to="/settings/whatsapp"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-secondary text-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium">WhatsApp</div>
                                <div className="text-xs text-muted-foreground">Twilio integration</div>
                            </div>
                        </NavLink>

                        {/* Coming Soon Items */}
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground/50 cursor-not-allowed">
                            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium">Email</div>
                                <div className="text-xs">Coming soon</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground/50 cursor-not-allowed">
                            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                <Smartphone className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium">SMS</div>
                                <div className="text-xs">Coming soon</div>
                            </div>
                        </div>
                    </div>

                    {/* Integrations Section */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Integrations</p>
                        <NavLink
                            to="/settings/calendar"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-secondary text-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium">Google Calendar</div>
                                <div className="text-xs text-muted-foreground">Booking integration</div>
                            </div>
                        </NavLink>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {isSubRoute ? (
                    <Outlet />
                ) : (
                    <div className="p-6">
                        <div className="max-w-2xl">
                            <h1 className="text-xl font-semibold mb-2">Workspace Settings</h1>
                            <p className="text-muted-foreground mb-8">
                                Select a setting from the sidebar to configure.
                            </p>

                            <div className="rounded-xl border bg-card p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                                    <User className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium mb-1">Welcome to Settings</h3>
                                <p className="text-sm text-muted-foreground">
                                    Choose a category from the left to get started.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
