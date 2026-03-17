import { User, Phone, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ProfileDetailsProps {
    profileName: string
    phoneNumber: string
    onDisconnect: () => void
}

export function WhatsAppProfileDetails({ profileName, phoneNumber, onDisconnect }: ProfileDetailsProps) {
    return (
        <div className="space-y-6">
            <Card className="rounded-xl border shadow-none bg-slate-50/50">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
                            <User className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg text-foreground">
                                {profileName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm font-mono">
                                    {phoneNumber}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs text-emerald-600 font-medium">Active</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button
                variant="destructive"
                className="w-full flex items-center justify-center gap-2"
                onClick={onDisconnect}
                aria-label="Disconnect WhatsApp Account"
            >
                <LogOut className="h-4 w-4" />
                Disconnect WhatsApp
            </Button>
        </div>
    )
}
