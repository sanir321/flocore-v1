import { ShieldCheck, Facebook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MetaConnectCardProps {
    onConnect: () => void
}

export function WhatsAppMetaConnect({ onConnect }: MetaConnectCardProps) {
    return (
        <Card className="rounded-xl border shadow-none">
            <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Connect Meta WhatsApp Business Account
                </CardTitle>
                <CardDescription className="text-xs">
                    Connect using the Official Meta API to ensure reliable message delivery and advanced functionality.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button 
                onClick={onConnect}
                className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center gap-2 h-11"
                aria-label="Continue with Facebook to connect WhatsApp"
            >
                <Facebook className="h-5 w-5 fill-current" />
                Continue with Facebook
            </Button>
            <p className="text-[10px] text-center text-zinc-500 mt-2 flex items-center justify-center gap-1">
                <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 18C10.8954 18 10 17.1046 10 16V12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12V16C14 17.1046 13.1046 18 12 18ZM12 8C11.4477 8 11 7.55228 11 7C11 6.44772 11.4477 6 12 6C12.5523 6 13 6.44772 13 7C13 7.55228 12.5523 8 12 8Z" />
                </svg>
                Secure Meta API Connection
            </p>
                <p className="text-xs text-center text-muted-foreground">
                    Make sure your Business Manager is verified to unlock unlimited messaging.
                </p>
            </CardContent>
        </Card>
    )
}
