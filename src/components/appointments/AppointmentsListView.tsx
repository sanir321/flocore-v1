import { format, addDays, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar as CalendarIcon, Link as LinkIcon, Plus, ChevronRight } from 'lucide-react'

export function AppointmentsListView({ appointments, handleCancel, handleCopyLink, openAddModal, filterShow, setFilterShow }: any) {
    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex-none px-6 py-6 border-b flex items-center justify-between bg-white">
                <h1 className="text-2xl font-bold">Appointments</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyLink} className="h-9">
                        <LinkIcon className="h-4 w-4 mr-2" /> Copy link
                    </Button>
                    <Button size="sm" onClick={openAddModal} className="h-9 bg-black text-white hover:bg-gray-800">
                        <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 flex items-center gap-2 text-sm border-b bg-white/50">
                <span className="text-muted-foreground">Show</span>
                <div className="relative">
                    <select
                        className="appearance-none border rounded-md px-3 py-1.5 pr-8 bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/20"
                        value={filterShow}
                        onChange={(e) => setFilterShow(e.target.value)}
                        aria-label="Show appointments"
                    >
                        <option value="All">All</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <ChevronRight className="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground rotate-90" />
                </div>

                <span className="text-muted-foreground ml-2">during</span>
                <button className="border rounded-md px-3 py-1.5 bg-background text-sm font-medium flex items-center gap-2">
                    {format(new Date(), 'MMM d, yyyy')} - {format(addDays(new Date(), 7), 'MMM d, yyyy')}
                    <ChevronRight className="h-3 w-3 rotate-90 text-muted-foreground" />
                </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-auto p-6">
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
        </div>
    )
}
