import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface WhatsAppCardProps {
    enabled: boolean
    phone: string
    onToggle: () => void
    onPhoneChange: (val: string) => void
    onSave: () => void
    isSaving: boolean
}

export function WhatsAppCard({ 
    enabled, 
    phone, 
    onToggle, 
    onPhoneChange, 
    onSave, 
    isSaving 
}: WhatsAppCardProps) {
    return (
        <Card className="rounded-xl border shadow-none hover:border-foreground/20 transition-all duration-300">
            <CardHeader className="pb-5">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                        <Phone className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-medium text-foreground">WhatsApp Admin Alerts</CardTitle>
                        <CardDescription className="text-sm mt-1">Receive instant high-priority alerts on your personal WhatsApp.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                    <Label htmlFor="wa-alerts" className="flex flex-col gap-1 cursor-pointer">
                        <span className="font-medium text-sm">Enable WhatsApp Alerts</span>
                        <span className="text-[11px] text-muted-foreground">The AI will message you directly for critical escalations.</span>
                    </Label>
                    <Switch
                        id="wa-alerts"
                        checked={enabled}
                        onCheckedChange={onToggle}
                        className="data-[state=checked]:bg-foreground"
                    />
                </div>

                {enabled && (
                    <div className="animate-in fade-in slide-in-from-top-1 pl-1">
                        <Label htmlFor="wa-phone" className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Personal WhatsApp Number</Label>
                        <div className="flex gap-3">
                            <Input
                                id="wa-phone"
                                value={phone}
                                onChange={(e) => onPhoneChange(e.target.value)}
                                placeholder="+1234567890"
                                className="max-w-md font-mono text-sm h-9 bg-white"
                                aria-describedby="wa-phone-desc"
                            />
                            <Button size="sm" variant="outline" onClick={onSave} disabled={isSaving} className="h-9">
                                Save Number
                            </Button>
                        </div>
                        <p id="wa-phone-desc" className="text-[10px] text-muted-foreground mt-2 leading-relaxed opacity-80">
                            Must include country code (e.g. +1 or +91).<br />
                            In Sandbox mode, this number must join your sandbox first. In Production, it works instantly.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
