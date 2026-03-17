import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, getHours, getMinutes } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export function AppointmentsCalendarView({ appointments, currentDate, setCurrentDate }: any) {
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
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
                <h2 className="text-2xl font-bold">Calendar</h2>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-9 px-3 gap-2 bg-gray-50 border-gray-200">
                        Active appointments <ChevronRight className="h-3 w-3 rotate-90" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 px-3 gap-2 bg-gray-50 border-gray-200">
                        Week <ChevronRight className="h-3 w-3 rotate-90" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 bg-gray-50 border-gray-200" onClick={() => setCurrentDate(new Date())}>Today</Button>
                </div>
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between px-8 py-4 border-b bg-white">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous Week
                </Button>

                <span className="text-base font-semibold">{format(startOfCurrentWeek, 'MMM d')} - {format(endOfCurrentWeek, 'MMM d, yyyy')}</span>

                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                    Next Week <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
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
