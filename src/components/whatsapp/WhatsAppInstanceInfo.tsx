import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function WhatsAppInstanceInfo() {
    return (
        <Card className="rounded-xl border shadow-none">
            <CardHeader>
                <CardTitle className="text-base font-medium">API Details</CardTitle>
                <CardDescription className="text-xs">
                    Your Official Meta Cloud API connection configuration.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-dashed">
                    <span className="text-xs text-muted-foreground">API Provider</span>
                    <span className="text-xs font-mono">Meta Graph API v19.0</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <span className="text-xs font-mono capitalize">Online</span>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-muted-foreground">Capabilities</span>
                    <span className="text-xs font-mono text-muted-foreground">Templates, Webhooks, Interactive</span>
                </div>
            </CardContent>
        </Card>
    )
}
