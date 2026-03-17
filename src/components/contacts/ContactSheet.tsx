import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ContactSheetProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    selectedContact: any | null
    formData: {
        name: string
        email: string
        phone: string
        tags: string
        notes: string
    }
    setFormData: (data: any) => void
    onSave: () => Promise<void>
}

export function ContactSheet({
    isOpen,
    onOpenChange,
    selectedContact,
    formData,
    setFormData,
    onSave
}: ContactSheetProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>{selectedContact ? 'Edit Contact' : 'New Contact'}</SheetTitle>
                    <SheetDescription>
                        Update contact details, tags, and internal notes.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="contact-name">Full Name</Label>
                        <Input
                            id="contact-name"
                            value={formData.name}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact-phone">Phone</Label>
                            <Input
                                id="contact-phone"
                                value={formData.phone}
                                onChange={(e) => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
                                placeholder="+1234567890"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact-email">Email</Label>
                            <Input
                                id="contact-email"
                                value={formData.email}
                                onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact-tags">Tags (comma separated)</Label>
                        <Input
                            id="contact-tags"
                            value={formData.tags}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, tags: e.target.value }))}
                            placeholder="VIP, Lead, Interested"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact-notes">Internal Notes</Label>
                        <Textarea
                            id="contact-notes"
                            value={formData.notes}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add notes about specific preferences or history..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onSave}>Save Changes</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
