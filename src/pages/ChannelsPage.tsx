import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    MessageSquare, 
    Mail, 
    Slack, 
    Send, 
    Globe, 
    CheckCircle2, 
    Circle, 
    Settings2,
    ArrowRight
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useWhatsAppConnection } from '@/hooks/queries/useWhatsAppConnection'
import { useGmailConnection } from '@/hooks/queries/useGmailConnection'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

export default function ChannelsPage() {
    const { data: workspace } = useWorkspace()
    const workspaceId = workspace?.id

    const { data: whatsappConn } = useWhatsAppConnection(workspaceId)
    const { data: gmailConn } = useGmailConnection(workspaceId)

    const { data: extraConns } = useQuery({
        queryKey: ['extra-connections', workspaceId],
        queryFn: async () => {
            const [slack, telegram, webchat] = await Promise.all([
                supabase.from('slack_connections').select('id').eq('workspace_id', workspaceId || '').maybeSingle(),
                supabase.from('telegram_connections').select('id').eq('workspace_id', workspaceId || '').maybeSingle(),
                supabase.from('webchat_settings').select('id').eq('workspace_id', workspaceId || '').maybeSingle()
            ])
            return {
                slack: !!slack.data,
                telegram: !!telegram.data,
                webchat: !!webchat.data
            }
        },
        enabled: !!workspaceId
    })

    const channels = [
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            description: 'Connect your business WhatsApp via Meta Cloud API.',
            icon: MessageSquare,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            borderColor: 'border-emerald-100',
            path: '/settings/whatsapp',
            isConnected: !!whatsappConn?.connected,
            status: whatsappConn?.connected ? 'Online' : 'Not Configured'
        },
        {
            id: 'gmail',
            name: 'Gmail',
            description: 'AI-powered email handling for your business inbox.',
            icon: Mail,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            borderColor: 'border-blue-100',
            path: '/settings/gmail',
            isConnected: !!gmailConn?.is_active,
            status: gmailConn?.is_active ? 'Online' : 'Not Configured'
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'Deploy your agent to Slack channels and workspaces.',
            icon: Slack,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
            borderColor: 'border-teal-100',
            path: '/settings/slack',
            isConnected: !!extraConns?.slack,
            status: extraConns?.slack ? 'Online' : 'Not Configured'
        },
        {
            id: 'telegram',
            name: 'Telegram',
            description: 'Automate interactions on Telegram via Bot API.',
            icon: Send,
            color: 'text-sky-500',
            bg: 'bg-sky-50',
            borderColor: 'border-sky-100',
            path: '/settings/telegram',
            isConnected: !!extraConns?.telegram,
            status: extraConns?.telegram ? 'Online' : 'Not Configured'
        },
        {
            id: 'webchat',
            name: 'Webchat',
            description: 'Embed a live chat widget on your website.',
            icon: Globe,
            color: 'text-slate-700',
            bg: 'bg-slate-50',
            borderColor: 'border-slate-200',
            path: '/settings/webchat',
            isConnected: !!extraConns?.webchat,
            status: extraConns?.webchat ? 'Enabled' : 'Not Configured'
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Manage all your communication touchpoints in one place. Connect your social accounts and embed widgets to empower your AI agent.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.map((channel) => (
                    <Card key={channel.id} className="overflow-hidden border shadow-none hover:border-primary/20 transition-all group">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${channel.bg} ${channel.borderColor}`}>
                                    <channel.icon className={`h-6 w-6 ${channel.color}`} />
                                </div>
                                <Badge variant={channel.isConnected ? "default" : "secondary"} className="h-5 px-1.5 text-[10px] font-bold">
                                    {channel.isConnected ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Circle className="h-3 w-3 mr-1 opacity-20" />}
                                    {channel.status}
                                </Badge>
                            </div>
                            <CardTitle className="text-xl mt-4">{channel.name}</CardTitle>
                            <CardDescription className="text-sm leading-relaxed line-clamp-2">
                                {channel.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                asChild 
                                className="w-full mt-4 justify-between font-medium group-hover:bg-primary group-hover:text-white transition-all"
                                disabled={channel.status === 'Coming Soon'}
                            >
                                <NavLink to={channel.path}>
                                    Configure
                                    <ArrowRight className="h-4 w-4 ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </NavLink>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-slate-900 border-none shadow-xl overflow-hidden text-white relative">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Settings2 className="w-32 h-32 rotate-12" />
                 </div>
                 <CardHeader>
                    <CardTitle className="text-2xl">Omni-Channel Strategy</CardTitle>
                    <CardDescription className="text-slate-400 max-w-lg">
                        Enable all channels to provide a seamless customer experience. Your AI agent maintains context across platforms, so a customer can start on WhatsApp and finish on Email.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 h-12">
                        View Analytics
                    </Button>
                 </CardContent>
            </Card>
        </div>
    )
}
