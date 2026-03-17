import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'

interface AddAppointmentModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

export function AddAppointmentModal({ isOpen, onOpenChange, onSubmit }: AddAppointmentModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Manual Appointment</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="appt-date">Date</Label>
                            <Input id="appt-date" name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="appt-time">Time</Label>
                            <Input id="appt-time" name="time" type="time" required defaultValue="09:00" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="appt-title">Title</Label>
                        <Input id="appt-title" name="title" placeholder="Meeting with client" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="appt-email">Email (Optional)</Label>
                        <Input id="appt-email" name="email" type="email" placeholder="client@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="appt-phone">Phone (Optional)</Label>
                        <Input id="appt-phone" name="phone" type="tel" placeholder="+1234567890" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="appt-duration">Duration (Min)</Label>
                        <Input id="appt-duration" name="duration" type="number" defaultValue="60" />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Appointment</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
