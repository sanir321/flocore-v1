import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Wrench, ChevronRight } from 'lucide-react'
import type { Tool } from '@/components/agents/types'

export const AI_TOOLS: Tool[] = [
    {
        id: 'check_availability',
        name: 'check-availability',
        description: 'Retrieve available appointment time slots from the calendar system for a specified date. Returns a list of open slots that can be booked.',
        executionMessage: 'One moment, let me check the available slots for a date.',
        parameters: [
            { name: 'date', type: 'string', required: true, description: 'Date in YYYY-MM-DD format to check availability' }
        ]
    },
    {
        id: 'book_appointment',
        name: 'book-appointment',
        description: 'Schedule an appointment by collecting contact information (name, email, phone) and booking the selected time slot. Sends a confirmation to the customer.',
        executionMessage: 'Let me book that appointment for you.',
        parameters: [
            { name: 'start_time', type: 'string', required: true, description: 'ISO 8601 datetime for appointment start' },
            { name: 'summary', type: 'string', required: true, description: 'Title/summary of the appointment' },
            { name: 'attendee_email', type: 'string', required: true, description: 'Email address of the attendee' },
            { name: 'duration_minutes', type: 'number', required: false, description: 'Duration in minutes (default: 60)' }
        ]
    },
    {
        id: 'get_appointments',
        name: 'get-appointments',
        description: 'Retrieve all upcoming and currently ongoing appointments. Can filter by attendee email to find specific bookings.',
        executionMessage: 'Checking for upcoming appointments...',
        parameters: [
            { name: 'email', type: 'string', required: false, description: 'Filter by attendee email address' }
        ]
    },
    {
        id: 'cancel_appointment',
        name: 'cancel-appointment',
        description: 'Cancel an existing scheduled appointment. Can identify appointment by Event ID or Attendee Email.',
        executionMessage: 'I\'ll cancel that appointment for you.',
        parameters: [
            { name: 'event_id', type: 'string', required: false, description: 'Google Calendar Event ID' },
            { name: 'email', type: 'string', required: false, description: 'Attendee email (if Event ID unknown)' }
        ]
    },
    {
        id: 'reschedule_appointment',
        name: 'reschedule-appointment',
        description: 'Change the date and time of an existing appointment to new start time. Handles finding the appointment and updating it.',
        executionMessage: 'Let me reschedule that for you.',
        parameters: [
            { name: 'new_start_time', type: 'string', required: true, description: 'New ISO 8601 start time' },
            { name: 'event_id', type: 'string', required: false, description: 'Google Calendar Event ID' },
            { name: 'email', type: 'string', required: false, description: 'Attendee email (to find appointment)' },
            { name: 'duration_minutes', type: 'number', required: false, description: 'New duration (default: keeps existing or 60)' }
        ]
    }
]

export function ToolsView({ onSelectTool }: { onSelectTool: (tool: Tool) => void }) {
    return (
        <div className="p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold">AI Tools</h1>
                <p className="text-muted-foreground">Tools that your AI agent can access</p>
            </div>

            <Card className="rounded-xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Appointment Management</CardTitle>
                            <CardDescription>AI can check availability and schedule appointments</CardDescription>
                        </div>
                        <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">{AI_TOOLS.length} tools</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {AI_TOOLS.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => onSelectTool(tool)}
                                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                                aria-label={`Configure ${tool.name} tool`}
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Wrench className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{tool.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
