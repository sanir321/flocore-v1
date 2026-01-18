import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface FirstTimeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onComplete: () => void
}

export default function FirstTimeModal({ open, onOpenChange, onComplete }: FirstTimeModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Welcome to Flowcore!</DialogTitle>
                    <DialogDescription>
                        Your AI-powered workspace is ready. Here's what you can do:
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <ul className="list-disc leading-relaxed pl-5 text-sm text-muted-foreground">
                        <li>Connect your <strong>WhatsApp</strong> number to start talking to customers.</li>
                        <li>Link your <strong>Google Calendar</strong> to enable appointment bookings.</li>
                        <li>Configure your <strong>AI Agents</strong> with custom knowledge from your wiki.</li>
                    </ul>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={onComplete}>Let's Go!</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
