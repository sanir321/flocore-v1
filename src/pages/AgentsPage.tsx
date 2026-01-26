import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Bot, Save, Sparkles, Wrench, ArrowLeft, ChevronRight, MessageSquare, Mic, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
import type { Tables } from '@/types/database.types'

interface Agent {
    id: string
    name: string
    type: string
    model: string
    system_prompt: string
    active: boolean
}

interface Wiki {
    business_info: string | null
    faqs: string | null
    procedures: string | null
    conflict_handling: string | null
}

interface EscalationRules {
    angry_language: boolean
    pricing_dispute: boolean
    human_request: boolean
    custom_keywords: string[] | null
}

interface Tool {
    id: string
    name: string
    description: string
    executionMessage: string
    parameters: { name: string; type: string; required: boolean; description: string }[]
}

// Define available tools
const AI_TOOLS: Tool[] = [
    {
        id: 'check_availability',
        name: 'check-availability',
        description: 'Retrieve available appointment time slots from the calendar system for a specified date. Returns a list of open slots that can be booked.',
        executionMessage: 'One moment, let me check the available slots for a date.',
        parameters: [
            { name: 'date', type: 'string', required: true, description: 'Date in YYYY-MM-DD format to check availability' }
        ]
    },
    {
        id: 'book_appointment',
        name: 'book-appointment',
        description: 'Schedule an appointment by collecting contact information (name, email, phone) and booking the selected time slot. Sends a confirmation to the customer.',
        executionMessage: 'Let me book that appointment for you.',
        parameters: [
            { name: 'start_time', type: 'string', required: true, description: 'ISO 8601 datetime for appointment start' },
            { name: 'summary', type: 'string', required: true, description: 'Title/summary of the appointment' },
            { name: 'attendee_email', type: 'string', required: true, description: 'Email address of the attendee' },
            { name: 'duration_minutes', type: 'number', required: false, description: 'Duration in minutes (default: 60)' }
        ]
    },
    {
        id: 'get_appointments',
        name: 'get-appointments',
        description: 'Retrieve all upcoming and currently ongoing appointments. Can filter by attendee email to find specific bookings.',
        executionMessage: 'Checking for upcoming appointments...',
        parameters: [
            { name: 'email', type: 'string', required: false, description: 'Filter by attendee email address' }
        ]
    },
    {
        id: 'cancel_appointment',
        name: 'cancel-appointment',
        description: 'Cancel an existing scheduled appointment. Can identify appointment by Event ID or Attendee Email.',
        executionMessage: 'I\'ll cancel that appointment for you.',
        parameters: [
            { name: 'event_id', type: 'string', required: false, description: 'Google Calendar Event ID' },
            { name: 'email', type: 'string', required: false, description: 'Attendee email (if Event ID unknown)' }
        ]
    },
    {
        id: 'reschedule_appointment',
        name: 'reschedule-appointment',
        description: 'Change the date and time of an existing appointment to new start time. Handles finding the appointment and updating it.',
        executionMessage: 'Let me reschedule that for you.',
        parameters: [
            { name: 'new_start_time', type: 'string', required: true, description: 'New ISO 8601 start time' },
            { name: 'event_id', type: 'string', required: false, description: 'Google Calendar Event ID' },
            { name: 'email', type: 'string', required: false, description: 'Attendee email (to find appointment)' },
            { name: 'duration_minutes', type: 'number', required: false, description: 'New duration (default: keeps existing or 60)' }
        ]
    }
]

type ViewMode = 'chat-agents' | 'voice-agents' | 'tools' | 'escalations' | 'agent-detail' | 'tool-detail' | 'knowledge-base'

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [wiki, setWiki] = useState<Wiki | null>(null)
    const [escalationRules, setEscalationRules] = useState<EscalationRules | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('chat-agents')
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
    const [isAgentsExpanded, setIsAgentsExpanded] = useState(true)
    const [escalatedConversations, setEscalatedConversations] = useState<Tables<'conversations'>[]>([])
    const { toast } = useToast()

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: workspace } = await supabase
                .from('workspaces')
                .select('id')
                .eq('owner_id', user.id)
                .single()

            if (!workspace) {
                setLoading(false)
                return
            }

            setWorkspaceId(workspace.id)

            const { data: agentsData } = await supabase
                .from('agents')
                .select('*')
                .eq('workspace_id', workspace.id)

            if (agentsData) {
                setAgents(agentsData as Agent[])
            }

            const { data: wikiData } = await supabase
                .from('agent_wiki')
                .select('*')
                .eq('workspace_id', workspace.id)
                .single()

            if (wikiData) {
                setWiki(wikiData as unknown as Wiki)
            }

            const { data: rulesData } = await supabase
                .from('escalation_rules')
                .select('*')
                .eq('workspace_id', workspace.id)
                .single()

            if (rulesData) {
                setEscalationRules(rulesData as unknown as EscalationRules)
            }

            const { data: escalatedData } = await supabase
                .from('conversations')
                .select('*')
                .eq('workspace_id', workspace.id)
                .not('escalation_reason', 'is', null)
                .order('last_message_at', { ascending: false })

            if (escalatedData) {
                setEscalatedConversations(escalatedData)
            }

            setLoading(false)
        }

        fetchData()
    }, [])

    const handleSaveAgent = async () => {
        if (!selectedAgent || !workspaceId) return
        setSaving(true)

        try {
            await supabase
                .from('agents')
                .update({
                    name: selectedAgent.name,
                    model: selectedAgent.model,
                    system_prompt: selectedAgent.system_prompt,
                    active: selectedAgent.active
                })
                .eq('id', selectedAgent.id)

            toast({ title: "Success", description: "Agent saved successfully." })
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleSaveWiki = async () => {
        if (!wiki || !workspaceId) return
        setSaving(true)

        try {
            await supabase
                .from('agent_wiki')
                .update(wiki)
                .eq('workspace_id', workspaceId)

            toast({ title: "Success", description: "Knowledge base saved." })
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleSaveRules = async () => {
        if (!escalationRules || !workspaceId) return
        setSaving(true)

        try {
            await supabase
                .from('escalation_rules')
                .update(escalationRules)
                .eq('workspace_id', workspaceId)

            toast({ title: "Success", description: "Escalation rules saved." })
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleAgentClick = (agent: Agent) => {
        setSelectedAgent(agent)
        setViewMode('agent-detail')
    }

    const handleToolClick = (tool: Tool) => {
        setSelectedTool(tool)
        setViewMode('tool-detail')
    }

    if (loading) {
        return <FlowCoreLoader />
    }

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r bg-card flex flex-col p-4">
                <div className="mb-6">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        Agent Hub
                    </h2>
                </div>

                <div className="space-y-1">
                    <div className="mb-2">
                        <button
                            onClick={() => setIsAgentsExpanded(!isAgentsExpanded)}
                            className="w-full px-3 py-2 text-sm font-semibold text-foreground flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                Agents
                            </div>
                            <ChevronRight className={cn("h-4 w-4 transition-transform", isAgentsExpanded && "rotate-90")} />
                        </button>

                        {isAgentsExpanded && (
                            <div className="ml-2 pl-2 border-l border-border space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
                                <button
                                    onClick={() => setViewMode('chat-agents')}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        viewMode === 'chat-agents' || viewMode === 'agent-detail'
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Chat Agents
                                </button>

                                <button
                                    onClick={() => setViewMode('voice-agents')}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        viewMode === 'voice-agents'
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <Mic className="h-4 w-4" />
                                    Voice Agents
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setViewMode('tools')}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            viewMode === 'tools' || viewMode === 'tool-detail'
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <Wrench className="h-4 w-4" />
                        AI Tools
                    </button>

                    <button
                        onClick={() => setViewMode('escalations')}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            viewMode === 'escalations'
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Escalations
                    </button>

                    <button
                        onClick={() => setViewMode('knowledge-base')}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            viewMode === 'knowledge-base'
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <Bot className="h-4 w-4" />
                        Knowledge Base
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-slate-50/50">

                {/* Chat Agents Grid View */}
                {viewMode === 'chat-agents' && (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-semibold">Chat Agents</h1>
                            <Button size="sm" variant="outline">Create Chat Agent</Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents.map(agent => (
                                <button
                                    key={agent.id}
                                    onClick={() => handleAgentClick(agent)}
                                    className="group text-left relative bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                    {/* Decoration Pattern */}
                                    <div className="h-24 bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-[0.4]"
                                            style={{
                                                backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
                                                backgroundSize: '12px 12px'
                                            }}
                                        />
                                    </div>

                                    {/* Icon */}
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2">
                                        <div className="h-20 w-20 rounded-full bg-white p-2 shadow-sm">
                                            <div className="w-full h-full rounded-full bg-teal-50 flex items-center justify-center">
                                                <CheckCircle2 className="h-8 w-8 text-teal-600" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-14 pb-8 px-6 text-center">
                                        <h3 className="font-semibold text-lg mb-2">{agent.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                            AI agent specialized in scheduling and managing appointments with precision.
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                                            <span className="text-xs font-medium text-amber-500">Copilot</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Agent Detail View (Existing Editor) */}
                {viewMode === 'agent-detail' && selectedAgent && (
                    <div className="p-8">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewMode('chat-agents')}
                                    className="gap-2 text-muted-foreground"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Agents
                                </Button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-semibold">{selectedAgent.name}</h1>
                                    <p className="text-sm text-muted-foreground">Configure agent behavior and personality</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300"
                                            checked={selectedAgent.active}
                                            onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, active: e.target.checked } : null)}
                                        />
                                        Active
                                    </label>
                                    <Button onClick={handleSaveAgent} disabled={saving}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </div>

                            <Card className="rounded-xl shadow-sm border-0">
                                <CardContent className="p-6 grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Agent Name</Label>
                                        <Input
                                            value={selectedAgent.name}
                                            onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, name: e.target.value } : null)}
                                            className="rounded-xl bg-slate-50/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Model</Label>
                                        <select
                                            className="flex h-10 w-full rounded-xl border border-input bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            value={selectedAgent.model}
                                            onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, model: e.target.value } : null)}
                                        >
                                            <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</option>
                                            <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</option>
                                            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">System Prompt</Label>
                                <textarea
                                    className="flex min-h-[200px] w-full rounded-xl border border-input bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none shadow-sm"
                                    value={selectedAgent.system_prompt}
                                    onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, system_prompt: e.target.value } : null)}
                                    placeholder="You are a helpful customer support assistant..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Knowledge Base View */}
                {viewMode === 'knowledge-base' && wiki && (
                    <div className="p-8">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="mb-8">
                                <h1 className="text-2xl font-semibold">Knowledge Base</h1>
                                <p className="text-muted-foreground">Global information available to all agents</p>
                            </div>

                            <Card className="rounded-xl shadow-sm border-0 bg-white">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">Data Sources</CardTitle>
                                            <CardDescription>Populate your knowledge base from external sources</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Website Scraper */}
                                    <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                <Bot className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium">Import from Website</h3>
                                                <p className="text-xs text-muted-foreground">Scrape business info from your company site</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="https://example.com"
                                                className="bg-white"
                                                id="website-url"
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={async () => {
                                                    const urlInput = document.getElementById('website-url') as HTMLInputElement
                                                    const url = urlInput.value
                                                    if (!url) {
                                                        toast({ title: "Error", description: "Please enter a URL", variant: "destructive" })
                                                        return
                                                    }

                                                    setSaving(true)
                                                    toast({ title: "Scraping Website...", description: "This may take a few seconds." })

                                                    try {
                                                        const { data, error } = await supabase.functions.invoke('scrape-website', {
                                                            body: { url }
                                                        })

                                                        if (error) throw error

                                                        setWiki(prev => {
                                                            if (!prev) return null
                                                            return {
                                                                ...prev,
                                                                business_info: (prev.business_info ? prev.business_info + '\n\n' : '') + `=== SCOPED FROM ${url} ===\nTitle: ${data.title}\n${data.content}`
                                                            }
                                                        })

                                                        toast({ title: "Success", description: "Website content added to Business Info." })
                                                    } catch (error: any) {
                                                        toast({ title: "Error", description: error.message || "Failed to scrape website", variant: "destructive" })
                                                    } finally {
                                                        setSaving(false)
                                                    }
                                                }}
                                                disabled={saving}
                                            >
                                                {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Fetch"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                                <Bot className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium">Upload Documents</h3>
                                                <p className="text-xs text-muted-foreground">Upload PDFs or Text files for FAQs and Policies</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center w-full">
                                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-gray-500">PDF, TXT, MD (MAX. 5MB)</p>
                                                </div>
                                                <input
                                                    id="dropzone-file"
                                                    type="file"
                                                    className="hidden"
                                                    accept=".txt,.md,.pdf"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0]
                                                        if (!file) return

                                                        setSaving(true)
                                                        toast({ title: "Processing File...", description: "Extracting text..." })

                                                        try {
                                                            let text = ""
                                                            if (file.type === 'application/pdf') {
                                                                // Basic PDF handling info for user
                                                                toast({ title: "Info", description: "Full PDF parsing requires backend. Treating as plain text for now." })
                                                                // Placeholder for real PDF logic
                                                                text = `[PDF File: ${file.name}] - (Content extraction pending server setup)`
                                                            } else {
                                                                text = await file.text()
                                                            }

                                                            setWiki(prev => {
                                                                if (!prev) return null
                                                                return {
                                                                    ...prev,
                                                                    procedures: (prev.procedures ? prev.procedures + '\n\n' : '') + `=== FILE: ${file.name} ===\n${text}`
                                                                }
                                                            })

                                                            toast({ title: "Success", description: "File content added to Procedures." })
                                                        } catch (error: any) {
                                                            toast({ title: "Error", description: "Failed to read file", variant: "destructive" })
                                                        } finally {
                                                            setSaving(false)
                                                            // Reset input
                                                            e.target.value = ''
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl shadow-sm border-0 bg-white">
                                <CardHeader>
                                    <CardTitle className="text-base">Business Knowledge</CardTitle>
                                    <CardDescription>Information the AI uses to answer questions about your business</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Business Information</Label>
                                            <textarea
                                                className="flex min-h-[100px] w-full rounded-xl border border-input bg-slate-50/50 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                value={wiki.business_info || ''}
                                                onChange={(e) => setWiki(prev => prev ? { ...prev, business_info: e.target.value } : null)}
                                                placeholder="Company name, hours, location... (Populated by scraper)"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">FAQs</Label>
                                            <textarea
                                                className="flex min-h-[100px] w-full rounded-xl border border-input bg-slate-50/50 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                value={wiki.faqs || ''}
                                                onChange={(e) => setWiki(prev => prev ? { ...prev, faqs: e.target.value } : null)}
                                                placeholder="Q: What are your hours?..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Procedures</Label>
                                            <textarea
                                                className="flex min-h-[100px] w-full rounded-xl border border-input bg-slate-50/50 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                value={wiki.procedures || ''}
                                                onChange={(e) => setWiki(prev => prev ? { ...prev, procedures: e.target.value } : null)}
                                                placeholder="How to process refunds... (Populated by file upload)"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Conflict Handling</Label>
                                            <textarea
                                                className="flex min-h-[100px] w-full rounded-xl border border-input bg-slate-50/50 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                value={wiki.conflict_handling || ''}
                                                onChange={(e) => setWiki(prev => prev ? { ...prev, conflict_handling: e.target.value } : null)}
                                                placeholder="How to de-escalate..."
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveWiki} disabled={saving} className="w-full">
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? "Saving..." : "Save Knowledge Base"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Voice Agents (Coming Soon) */}
                {viewMode === 'voice-agents' && (
                    <div className="flex h-full items-center justify-center p-8">
                        <div className="text-center max-w-md">
                            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mic className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-semibold mb-2">Voice Agents</h2>
                            <p className="text-muted-foreground mb-6">
                                Create agents that can speak and listen in real-time.
                                We're putting the finishing touches on this feature.
                            </p>
                            <Button disabled variant="outline">Coming Soon</Button>
                        </div>
                    </div>
                )}

                {/* AI Tools */}
                {viewMode === 'tools' && (
                    <div className="p-8">
                        <div className="mb-8">
                            <h1 className="text-2xl font-semibold">AI Tools</h1>
                            <p className="text-muted-foreground">Tools that your AI agent can access</p>
                        </div>

                        <Card className="rounded-xl border-0 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">Appointment Management</CardTitle>
                                        <CardDescription>AI can check availability and schedule appointments</CardDescription>
                                    </div>
                                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">{AI_TOOLS.length} tools</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {AI_TOOLS.map(tool => (
                                        <button
                                            key={tool.id}
                                            onClick={() => handleToolClick(tool)}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Wrench className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">{tool.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tool Detail View */}
                {viewMode === 'tool-detail' && selectedTool && (
                    <div className="p-8">
                        <div className="max-w-4xl mx-auto">
                            <button
                                onClick={() => setViewMode('tools')}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Tools
                            </button>

                            <div className="mb-6">
                                <h1 className="text-2xl font-semibold">{selectedTool.name}</h1>
                                <p className="text-sm text-muted-foreground">Configure which agents can access this internal tool</p>
                            </div>

                            <div className="border-b mb-8">
                                <div className="flex gap-8">
                                    <button className="pb-3 border-b-2 border-primary text-sm font-medium">
                                        Information
                                    </button>
                                    <button className="pb-3 text-sm text-muted-foreground hover:text-foreground">
                                        Access
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8 max-w-2xl">
                                <div>
                                    <h3 className="font-medium mb-4">Tool Information</h3>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Tool name</Label>
                                            <Input value={selectedTool.name} disabled className="bg-slate-50 rounded-xl" />
                                            <p className="text-xs text-muted-foreground">Internal tool names cannot be modified.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Description</Label>
                                            <textarea
                                                className="flex min-h-[100px] w-full rounded-xl border border-input bg-slate-50 px-4 py-3 text-sm resize-none"
                                                value={selectedTool.description}
                                                disabled
                                            />
                                            <p className="text-xs text-muted-foreground">Internal tool descriptions are managed by the system.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Execution Message</Label>
                                            <Input value={selectedTool.executionMessage} disabled className="bg-slate-50 rounded-xl" />
                                            <p className="text-xs text-muted-foreground">Message shown to users when this tool is executing.</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-4">Parameters</h3>
                                    <div className="border rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                                                    <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                                                    <th className="text-left p-3 font-medium text-muted-foreground">Required</th>
                                                    <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y bg-white">
                                                {selectedTool.parameters.map(param => (
                                                    <tr key={param.name}>
                                                        <td className="p-3 font-mono text-xs">{param.name}</td>
                                                        <td className="p-3 text-muted-foreground">{param.type}</td>
                                                        <td className="p-3">
                                                            <span className={cn(
                                                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                                                param.required ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
                                                            )}>
                                                                {param.required ? 'Yes' : 'No'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-muted-foreground">{param.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Escalation Center View */}
                {viewMode === 'escalations' && (
                    <div className="p-8">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Escalation Center</h1>
                                    <p className="text-muted-foreground text-sm mt-1">Monitor and manage conversations flagged for human attention.</p>
                                </div>
                            </div>

                            {/* Tabs for Chat/Voice */}
                            <div className="border-b mb-6">
                                <div className="flex gap-6">
                                    <button className="pb-3 text-sm font-medium text-foreground border-b-2 border-foreground">
                                        Chat
                                    </button>
                                    <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                        Voice
                                    </button>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-3 mb-6">
                                <Button variant="outline" size="sm" className="h-9 text-sm bg-white">
                                    All Types <ChevronRight className="h-3 w-3 ml-1 rotate-90" />
                                </Button>
                                <Button variant="outline" size="sm" className="h-9 text-sm bg-white">
                                    Pending <ChevronRight className="h-3 w-3 ml-1 rotate-90" />
                                </Button>
                                <Button variant="outline" size="sm" className="h-9 text-sm bg-white">
                                    ↓ Newest First <ChevronRight className="h-3 w-3 ml-1 rotate-90" />
                                </Button>
                                <div className="flex-1" />
                                <span className="text-sm text-muted-foreground">0 escalations (filtered)</span>
                            </div>

                            {/* Table Header */}
                            <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-slate-50 rounded-t-lg border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <div>Escalation</div>
                                <div>Type</div>
                                <div>Severity</div>
                                <div>Status</div>
                            </div>

                            {/* Escalations List or Empty State */}
                            {escalatedConversations.length > 0 ? (
                                <div className="bg-white border rounded-b-lg overflow-hidden">
                                    {escalatedConversations.map(conv => (
                                        <div key={conv.id} className="grid grid-cols-4 gap-4 px-4 py-4 border-b last:border-0 hover:bg-slate-50 transition-colors items-center">
                                            <div>
                                                <div className="font-medium text-sm text-foreground">{conv.escalation_reason}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">ID: {conv.contact_id.slice(0, 8)}...</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="capitalize text-sm text-foreground">{conv.channel || 'chat'}</span>
                                            </div>
                                            <div>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                                                    High Priority
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "inline-flex h-2 w-2 rounded-full",
                                                    conv.status === 'open' ? "bg-green-500" : "bg-slate-300"
                                                )} />
                                                <span className="capitalize text-sm text-foreground">{conv.status || 'open'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-t-0 rounded-b-lg bg-white p-16 text-center">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-50 border flex items-center justify-center">
                                        <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">No escalations found</h3>
                                    <p className="text-muted-foreground text-sm">No conversations have been flagged for human attention yet.</p>
                                </div>
                            )}

                            {/* Escalation Rules Section */}
                            {escalationRules && (
                                <div className="mt-10 pt-8 border-t">
                                    <h2 className="text-lg font-semibold mb-4">Escalation Rules</h2>
                                    <Card className="rounded-xl border shadow-sm">
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="rule-angry"
                                                    className="mt-1 rounded border-gray-300"
                                                    checked={escalationRules.angry_language}
                                                    onChange={(e) => setEscalationRules(prev => prev ? { ...prev, angry_language: e.target.checked } : null)}
                                                />
                                                <div>
                                                    <label htmlFor="rule-angry" className="font-medium block cursor-pointer">Angry Language</label>
                                                    <p className="text-sm text-muted-foreground">Escalate when user uses profanity or hostile language</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="rule-pricing"
                                                    className="mt-1 rounded border-gray-300"
                                                    checked={escalationRules.pricing_dispute}
                                                    onChange={(e) => setEscalationRules(prev => prev ? { ...prev, pricing_dispute: e.target.checked } : null)}
                                                />
                                                <div>
                                                    <label htmlFor="rule-pricing" className="font-medium block cursor-pointer">Pricing Disputes</label>
                                                    <p className="text-sm text-muted-foreground">Escalate when user contests charges or refund policies</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="rule-human"
                                                    className="mt-1 rounded border-gray-300"
                                                    checked={escalationRules.human_request}
                                                    onChange={(e) => setEscalationRules(prev => prev ? { ...prev, human_request: e.target.checked } : null)}
                                                />
                                                <div>
                                                    <label htmlFor="rule-human" className="font-medium block cursor-pointer">Human Request</label>
                                                    <p className="text-sm text-muted-foreground">Escalate when user explicitly asks to speak to a person</p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t">
                                                <Button onClick={handleSaveRules} disabled={saving} size="sm">
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {saving ? "Saving..." : "Save Rules"}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Knowledge Base View */}
                {viewMode === 'knowledge-base' && wiki && (
                    <div className="p-8">
                        <div className="max-w-5xl mx-auto space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Knowledge Base</h1>
                                    <p className="text-muted-foreground text-sm mt-1">Manage the intelligence source for your agents.</p>
                                </div>
                                <Button onClick={handleSaveWiki} disabled={saving} size="sm">
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Data Sources */}
                                <div className="space-y-6">
                                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Data Sources</h2>

                                    {/* Website Import Card */}
                                    <Card className="rounded-xl border shadow-sm">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                                                    <Bot className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm font-medium">Website Import</CardTitle>
                                                    <CardDescription className="text-[10px]">Scrape public business info</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="https://example.com"
                                                    className="h-9 text-sm"
                                                />
                                                <Button variant="outline" size="sm" className="h-9 px-3">
                                                    Fetch
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* File Upload Card */}
                                    <Card className="rounded-xl border shadow-sm">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                                                    <Bot className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm font-medium">Document Upload</CardTitle>
                                                    <CardDescription className="text-[10px]">PDF, DOCX, TXT supported</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-foreground/20 transition-all">
                                                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                                    <p className="mb-1 text-xs text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-[10px] text-muted-foreground/50">MAX. 10MB</p>
                                                </div>
                                                <input type="file" className="hidden" />
                                            </label>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Center/Right Column: Editors */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="border-b pb-2 flex gap-6">
                                        <button className="pb-2 text-sm font-medium text-foreground border-b-2 border-foreground">
                                            Business Info
                                        </button>
                                        <button className="pb-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                            FAQs
                                        </button>
                                        <button className="pb-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                            Procedures
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Core Business Knowledge</Label>
                                        <textarea
                                            className="w-full min-h-[400px] font-mono text-sm leading-relaxed bg-white border border-slate-200 rounded-lg p-4 resize-none focus:ring-1 focus:ring-foreground focus:border-foreground outline-none"
                                            placeholder="# Business Overview..."
                                            value={wiki.business_info || ''}
                                            onChange={(e) => setWiki(prev => prev ? { ...prev, business_info: e.target.value } : null)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

