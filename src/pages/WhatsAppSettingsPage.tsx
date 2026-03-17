import { useEffect, useState } from 'react'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { useWhatsAppConnection } from '@/hooks/queries/useWhatsAppConnection'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { whatsapp } from '@/lib/whatsapp'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Modular Components
import { WhatsAppConnectionStatus } from '@/components/whatsapp/WhatsAppConnectionStatus'
import { WhatsAppMetaConnect } from '@/components/whatsapp/WhatsAppMetaConnect'
import { WhatsAppProfileDetails } from '@/components/whatsapp/WhatsAppProfileDetails'
import { WhatsAppInstanceInfo } from '@/components/whatsapp/WhatsAppInstanceInfo'

type ViewState = 'loading' | 'not_connected' | 'connected'

export default function WhatsAppSettingsPage() {
    const { data: workspace, isLoading: workspaceLoading } = useWorkspace()
    const workspaceId = workspace?.id

    const { data: connectionData, isLoading: connectionLoading } = useWhatsAppConnection(workspaceId)
    const [viewState, setViewState] = useState<ViewState>('loading')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [profileName, setProfileName] = useState('')
    const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)
    const { toast } = useToast()
    const queryClient = useQueryClient()

    useEffect(() => {
        whatsapp.health()
            .then(h => setApiHealthy(h.status === 'ok'))
            .catch(() => setApiHealthy(false))
    }, [])

    useEffect(() => {
        if (workspaceLoading || connectionLoading) return

        if (!workspaceId) {
            setViewState('not_connected')
            return
        }

        if (connectionData?.connected) {
            setViewState('connected')
            setProfileName('Official WhatsApp Business')
            setPhoneNumber(import.meta.env.META_WHATSAPP_PHONE_ID || 'Configured via Meta Dashboard')
        } else {
            setViewState('not_connected')
        }
    }, [workspaceId, workspaceLoading, connectionLoading, connectionData])

    const handleConnect = async () => {
        if (!workspaceId) return
        
        try {
            setViewState('loading')
            const { error } = await supabase
                .from('whatsapp_connections')
                .upsert({
                    workspace_id: workspaceId,
                    instance_name: `meta_${workspaceId}`,
                    connected: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'workspace_id' })

            if (error) throw error

            queryClient.invalidateQueries({ queryKey: ['whatsapp_connection', workspaceId] })
            setViewState('connected')
            setProfileName('Official WhatsApp Business')
            setPhoneNumber(import.meta.env.META_WHATSAPP_PHONE_ID || 'Configured via Meta Dashboard')

            toast({
                title: "Connected Successfully!",
                description: "Official Meta WhatsApp Cloud API connected.",
            })
        } catch (error) {
            console.error('Connect failed:', error)
            toast({
                title: "Connection Failed",
                description: error instanceof Error ? error.message : "Failed to start WhatsApp connection",
                variant: "destructive"
            })
            setViewState('not_connected')
        }
    }

    const handleDisconnect = async () => {
        if (!workspaceId) return

        try {
            setViewState('loading')
            const { error } = await supabase
                .from('whatsapp_connections')
                .update({ connected: false })
                .eq('workspace_id', workspaceId)

            if (error) throw error

            queryClient.invalidateQueries({ queryKey: ['whatsapp_connection', workspaceId] })
            setViewState('not_connected')

            toast({
                title: "Disconnected",
                description: "WhatsApp has been disconnected."
            })
        } catch (error) {
            setViewState('connected')
        }
    }

    if (viewState === 'loading' || workspaceLoading || connectionLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            </div>
        )
    }

    return (
        <div className="space-y-10 max-w-4xl pb-20">
            {/* Header */}
            <div className="flex items-center gap-5 border-b pb-8">
                <div className="w-14 h-14 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                    <MessageSquare className="h-7 w-7" />
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">WhatsApp</h1>
                    <p className="text-muted-foreground text-sm mt-1">Connect your messaging channel to AI.</p>
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors",
                    apiHealthy === true && "bg-emerald-50 text-emerald-700 border-emerald-200",
                    apiHealthy === false && "bg-red-50 text-red-700 border-red-200",
                    apiHealthy === null && "bg-slate-50 text-muted-foreground border-slate-200"
                )}>
                    {apiHealthy === true ? (
                        <><Wifi className="h-3 w-3" /> API Online</>
                    ) : apiHealthy === false ? (
                        <><WifiOff className="h-3 w-3" /> API Offline</>
                    ) : (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Checking...</>
                    )}
                </div>
            </div>

            <WhatsAppConnectionStatus isConnected={viewState === 'connected'} />

            <div className="grid gap-6">
                {viewState === 'not_connected' && (
                    <WhatsAppMetaConnect onConnect={handleConnect} />
                )}

                {viewState === 'connected' && (
                    <>
                        <WhatsAppProfileDetails 
                            profileName={profileName}
                            phoneNumber={phoneNumber}
                            onDisconnect={handleDisconnect}
                        />
                        <WhatsAppInstanceInfo />
                    </>
                )}
            </div>
        </div>
    )
}
