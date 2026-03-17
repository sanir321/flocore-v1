import { useState } from 'react'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { Button } from '@/components/ui/button'
import { Bot, Sparkles, Wrench, ChevronRight, MessageSquare, Mic, AlertTriangle, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
import { type Agent } from '@/hooks/queries/useAgents'
import { type Tool } from '@/components/agents/types'

// Views
import { ChatAgentsView } from '@/components/agents/ChatAgentsView'
import { AgentDetailView } from '@/components/agents/AgentDetailView'
import { KnowledgeBaseView } from '@/components/agents/KnowledgeBaseView'
import { EscalationCenterView } from '@/components/agents/EscalationCenterView'
import { ToolsView } from '@/components/agents/ToolsView'
import { ToolDetailView } from '@/components/agents/ToolDetailView'

type ViewMode = 'chat-agents' | 'voice-agents' | 'tools' | 'escalations' | 'agent-detail' | 'tool-detail' | 'knowledge-base'

export default function AgentsPage() {
    const { data: workspace, isLoading, updateEscalation } = useWorkspace()
    const { toast } = useToast()
    const workspaceId = workspace?.id

    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('chat-agents')
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
    const [isAgentsExpanded, setIsAgentsExpanded] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Close mobile menu on view change
    const handleViewChange = (mode: ViewMode) => {
        setViewMode(mode)
        setMobileMenuOpen(false)
    }

    const handleAgentClick = (agent: Agent) => {
        setSelectedAgent(agent)
        handleViewChange('agent-detail')
    }

    const handleToolClick = (tool: Tool) => {
        setSelectedTool(tool)
        handleViewChange('tool-detail')
    }

    if (isLoading) {
        return <FlowCoreLoader />
    }

    return (
        <div className="flex h-full relative">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-14 left-0 right-0 z-40 h-12 bg-background/95 backdrop-blur-md border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-teal-500" />
                    <span className="font-semibold text-sm">Agent Hub</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={cn(
                "border-r bg-card flex flex-col p-4 transition-transform duration-300",
                "fixed md:static top-[104px] md:top-0 left-0 bottom-0 z-40 w-64",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="mb-6 hidden md:flex items-center justify-between">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-teal-500" />
                        Agent Hub
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">
                            {workspace?.escalation_enabled ? 'ON' : 'OFF'}
                        </span>
                        <Switch
                            aria-label="Toggle agent escalation"
                            checked={workspace?.escalation_enabled ?? true}
                            onCheckedChange={(checked) => {
                                if (!workspaceId) return
                                updateEscalation.mutate({ workspaceId, enabled: checked }, {
                                    onSuccess: () => {
                                        toast({
                                            title: checked ? "Escalation Enabled" : "Escalation Disabled",
                                            description: checked 
                                                ? "Agents will now escalate complex issues to humans." 
                                                : "Agents will handle all issues without escalation.",
                                        })
                                    },
                                    onError: () => {
                                        toast({
                                            title: "Update Failed",
                                            description: "Could not update escalation status.",
                                            variant: "destructive"
                                        })
                                    }
                                })
                            }}
                        />
                    </div>
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
                                    onClick={() => handleViewChange('chat-agents')}
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
                                    onClick={() => handleViewChange('voice-agents')}
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
                        onClick={() => handleViewChange('tools')}
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
                        onClick={() => handleViewChange('escalations')}
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
                        onClick={() => handleViewChange('knowledge-base')}
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
            <div className="flex-1 overflow-auto bg-slate-50/50 pt-12 md:pt-0">
                {viewMode === 'chat-agents' && workspaceId && (
                    <ChatAgentsView workspaceId={workspaceId} onAgentClick={handleAgentClick} />
                )}

                {viewMode === 'agent-detail' && selectedAgent && workspaceId && (
                    <AgentDetailView workspaceId={workspaceId} agent={selectedAgent} onBack={() => handleViewChange('chat-agents')} />
                )}

                {viewMode === 'knowledge-base' && workspaceId && (
                    <KnowledgeBaseView workspaceId={workspaceId} />
                )}

                {viewMode === 'escalations' && workspaceId && (
                    <EscalationCenterView workspaceId={workspaceId} />
                )}

                {viewMode === 'tools' && (
                    <ToolsView onSelectTool={handleToolClick} />
                )}

                {viewMode === 'tool-detail' && selectedTool && (
                    <ToolDetailView tool={selectedTool} onBack={() => handleViewChange('tools')} />
                )}

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
            </div>
        </div>
    )
}
