import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe, ArrowLeft, Loader2, Copy, Palette, Code, MessageSquare, Send } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { useToast } from '@/hooks/use-toast'

export default function WebchatSettingsPage() {
    const { data: workspace } = useWorkspace()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState<any>({
        widget_title: 'Chat with us',
        welcome_message: 'Hi there! How can we help you today?',
        primary_color: '#0f172a',
        position: 'right',
        enabled: true
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (workspace?.id) {
            fetchSettings()
        }
    }, [workspace?.id])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('webchat_settings')
                .select('*')
                .eq('workspace_id', workspace?.id || '')
                .maybeSingle()
            
            if (error) throw error
            if (data) setSettings(data)
        } catch (err) {
            // Error handled by UI state
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('webchat_settings')
                .upsert({
                    workspace_id: workspace?.id,
                    ...settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'workspace_id' })

            if (error) throw error
            toast({ title: "Settings Saved", description: "Your webchat widget has been updated." })
        } catch (err) {
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const embedCode = `
<script>
  window.FlowCoreConfig = {
    workspaceId: "${workspace?.id || 'YOUR_WORKSPACE_ID'}",
    primaryColor: "${settings.primary_color}",
    title: "${settings.widget_title}"
  };
</script>
<script src="${window.location.origin}/widget.js" async></script>
`.trim()

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" asChild>
                    <NavLink to="/settings/channels">
                        <ArrowLeft className="h-4 w-4" />
                    </NavLink>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Webchat Widget</h1>
                    <p className="text-muted-foreground text-sm">Add a live chat widget to your website to interact with visitors.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="appearance" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
                            <TabsTrigger value="appearance" className="data-[state=active]:bg-white">
                                <Palette className="h-4 w-4 mr-2" />
                                Design
                            </TabsTrigger>
                            <TabsTrigger value="content" className="data-[state=active]:bg-white">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Content
                            </TabsTrigger>
                            <TabsTrigger value="install" className="data-[state=active]:bg-white">
                                <Code className="h-4 w-4 mr-2" />
                                Install
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="appearance" className="space-y-6 outline-none">
                                <Card className="border shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Visual Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="primary-color-picker">Primary Color</Label>
                                            <div className="flex gap-3">
                                                <Input 
                                                    id="primary-color-picker"
                                                    type="color" 
                                                    className="w-12 h-10 p-1" 
                                                    value={settings.primary_color}
                                                    onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                                                    aria-label="Pick primary color"
                                                />
                                                <Input 
                                                    id="primary-color-hex"
                                                    value={settings.primary_color}
                                                    onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                                                    className="font-mono"
                                                    aria-label="Primary color hex code"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Widget Position</Label>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant={settings.position === 'left' ? 'default' : 'outline'} 
                                                    className="flex-1"
                                                    onClick={() => setSettings({...settings, position: 'left'})}
                                                >
                                                    Bottom Left
                                                </Button>
                                                <Button 
                                                    variant={settings.position === 'right' ? 'default' : 'outline'} 
                                                    className="flex-1"
                                                    onClick={() => setSettings({...settings, position: 'right'})}
                                                >
                                                    Bottom Right
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="content" className="space-y-6 outline-none">
                                <Card className="border shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Chat Experience</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="widget-title">Widget Title</Label>
                                            <Input 
                                                id="widget-title"
                                                value={settings.widget_title}
                                                onChange={(e) => setSettings({...settings, widget_title: e.target.value})}
                                                placeholder="e.g. Chat with us"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="welcome-message">Welcome Message</Label>
                                            <Input 
                                                id="welcome-message"
                                                value={settings.welcome_message}
                                                onChange={(e) => setSettings({...settings, welcome_message: e.target.value})}
                                                placeholder="e.g. Hi! How can we help?"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="install" className="space-y-6 outline-none">
                                <Card className="border shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Embed Code</CardTitle>
                                        <CardDescription>Copy and paste this code into the <code>&lt;body&gt;</code> of your website.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="relative">
                                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                                                {embedCode}
                                            </pre>
                                            <Button 
                                                className="absolute top-2 right-2 h-8 w-8" 
                                                variant="secondary" 
                                                size="icon"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(embedCode)
                                                    toast({ title: "Copied!", description: "Embed code copied to clipboard." })
                                                }}
                                                aria-label="Copy embed code"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <div className="flex justify-between items-center p-4 rounded-lg bg-slate-50 border">
                        <div className="flex items-center gap-3">
                            <Switch 
                                id="enable-widget"
                                checked={settings.enabled} 
                                onCheckedChange={(val) => setSettings({...settings, enabled: val})} 
                            />
                            <div className="text-sm">
                                <Label htmlFor="enable-widget" className="font-bold">Enable Widget</Label>
                                <p className="text-muted-foreground">The widget is currently {settings.enabled ? 'visible' : 'hidden'}.</p>
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="border shadow-lg sticky top-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Live Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px] flex items-end justify-center bg-slate-100 rounded-b-lg relative">
                             <div className={`absolute bottom-4 ${settings.position === 'right' ? 'right-4' : 'left-4'} w-72 bg-white rounded-xl shadow-2xl border overflow-hidden`}>
                                <div className="p-4 flex items-center gap-3" style={{backgroundColor: settings.primary_color, color: 'white'}}>
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-sm">{settings.widget_title}</span>
                                </div>
                                <div className="p-4 bg-slate-50 h-48 flex flex-col gap-3">
                                    <div className="p-3 bg-white border rounded-lg rounded-bl-none text-xs text-slate-600 max-w-[85%]">
                                        {settings.welcome_message}
                                    </div>
                                </div>
                                <div className="p-3 border-t bg-white flex gap-2">
                                    <div className="flex-1 h-8 rounded bg-slate-100" />
                                    <div className="w-8 h-8 rounded flex items-center justify-center text-white" style={{backgroundColor: settings.primary_color}}>
                                        <Send className="h-4 w-4" />
                                    </div>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
