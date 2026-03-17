import { useState } from 'react'
import { useAgents, type Agent } from '@/hooks/queries/useAgents'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, CheckCircle2, Headphones, Calendar, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatAgentsView({ 
    workspaceId, 
    onAgentClick 
}: { 
    workspaceId: string, 
    onAgentClick: (agent: Agent) => void 
}) {
    const agents = useAgents(workspaceId)
    const { toast } = useToast()
    
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newAgentName, setNewAgentName] = useState('')
    const [newAgentType, setNewAgentType] = useState<'support' | 'appointment' | 'sales'>('support')

    const AGENT_TEMPLATES = {
        support: {
            name: 'Support Agent',
            system_prompt: 'You are a helpful customer support agent. Answer questions clearly and concisely. If you cannot help, escalate to a human.',
            use_cases: ['customer_support']
        },
        appointment: {
            name: 'Appointment Agent',
            system_prompt: 'You are an appointment scheduling assistant. Help customers book, reschedule, or cancel appointments. Always confirm details before booking.',
            use_cases: ['appointments']
        },
        sales: {
            name: 'Sales Agent',
            system_prompt: 'You are a sales assistant. Help customers understand products and services. Guide them towards making a purchase decision.',
            use_cases: ['appointments', 'customer_support']
        }
    }

    const handleCreateAgent = async () => {
        if (!workspaceId || !newAgentName.trim()) {
            toast({ title: "Error", description: "Please enter an agent name", variant: "destructive" })
            return
        }

        const template = AGENT_TEMPLATES[newAgentType]

        agents.createAgent.mutate({
            name: newAgentName.trim(),
            type: newAgentType,
            model: 'llama-3.3-70b-versatile',
            system_prompt: template.system_prompt,
            active: true,
            use_cases: template.use_cases
        }, {
            onSuccess: () => {
                toast({ title: "Success", description: `${newAgentName} created successfully!` })
                setIsCreateDialogOpen(false)
                setNewAgentName('')
                setNewAgentType('support')
            },
            onError: (error) => {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Error", variant: "destructive" })
            }
        })
    }

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-semibold">Chat Agents</h1>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Agent
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Agent</DialogTitle>
                            <DialogDescription>
                                Choose an agent type and give it a name.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Agent Name</Label>
                                <Input
                                    placeholder="e.g., Sales Bot, Support Agent"
                                    value={newAgentName}
                                    onChange={(e) => setNewAgentName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Agent Type</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewAgentType('support')}
                                        className={cn(
                                            "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                                            newAgentType === 'support' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                                        )}
                                    >
                                        <Headphones className="h-5 w-5" />
                                        <span className="text-xs font-medium">Support</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewAgentType('appointment')}
                                        className={cn(
                                            "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                                            newAgentType === 'appointment' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                                        )}
                                    >
                                        <Calendar className="h-5 w-5" />
                                        <span className="text-xs font-medium">Booking</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewAgentType('sales')}
                                        className={cn(
                                            "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                                            newAgentType === 'sales' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                                        )}
                                    >
                                        <TrendingUp className="h-5 w-5" />
                                        <span className="text-xs font-medium">Sales</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateAgent} disabled={agents.createAgent.isPending || !newAgentName.trim()}>
                                {agents.createAgent.isPending ? "Creating..." : "Create Agent"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(agents.data || []).map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => onAgentClick(agent)}
                        className="group text-left relative bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                        <div className="h-24 bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.4]"
                                style={{
                                    backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
                                    backgroundSize: '12px 12px'
                                }}
                            />
                        </div>
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
                                {agent.system_prompt ? agent.system_prompt.slice(0, 80) + "..." : "AI agent specialized in customer operations."}
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", agent.active ? "bg-green-500" : "bg-gray-300")}></span>
                                <span className="text-xs font-medium text-slate-600">{agent.type || 'Assistant'}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
