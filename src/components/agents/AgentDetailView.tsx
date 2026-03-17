import { useState, useEffect } from 'react'
import { useAgents, type Agent } from '@/hooks/queries/useAgents'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'

export function AgentDetailView({ 
    workspaceId, 
    agent, 
    onBack 
}: { 
    workspaceId: string, 
    agent: Agent, 
    onBack: () => void 
}) {
    const agents = useAgents(workspaceId)
    const { toast } = useToast()
    
    const [selectedAgent, setSelectedAgent] = useState<Agent>(agent)

    useEffect(() => {
        setSelectedAgent(agent)
    }, [agent])

    const handleSaveAgent = async () => {
        if (!selectedAgent || !workspaceId) return

        agents.updateAgent.mutate({
            id: selectedAgent.id,
            name: selectedAgent.name,
            model: selectedAgent.model,
            system_prompt: selectedAgent.system_prompt,
            active: selectedAgent.active
        }, {
            onSuccess: () => {
                toast({ title: "Success", description: "Agent saved successfully." })
            },
            onError: (error) => {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Error", variant: "destructive" })
            }
        })
    }

    const saving = agents.updateAgent.isPending

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-2 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
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
                        <label htmlFor="agent-active" className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-lg border shadow-sm cursor-pointer">
                            <input
                                id="agent-active"
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedAgent.active ?? false}
                                onChange={(e) => setSelectedAgent(prev => ({ ...prev, active: e.target.checked }))}
                                aria-label="Agent Active Status"
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
                            <Label htmlFor="agent-name" className="text-xs uppercase tracking-wider text-muted-foreground">Agent Name</Label>
                            <Input
                                id="agent-name"
                                value={selectedAgent.name}
                                onChange={(e) => setSelectedAgent(prev => ({ ...prev, name: e.target.value }))}
                                className="rounded-xl bg-slate-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agent-model" className="text-xs uppercase tracking-wider text-muted-foreground">Model</Label>
                            <select
                                id="agent-model"
                                className="flex h-10 w-full rounded-xl border border-input bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={selectedAgent.model ?? ''}
                                onChange={(e) => setSelectedAgent(prev => ({ ...prev, model: e.target.value }))}
                            >
                                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</option>
                                <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</option>
                                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-2">
                    <Label htmlFor="system-prompt" className="text-xs uppercase tracking-wider text-muted-foreground">System Prompt</Label>
                    <textarea
                        id="system-prompt"
                        className="flex min-h-[200px] w-full rounded-xl border border-input bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none shadow-sm"
                        value={selectedAgent.system_prompt}
                        onChange={(e) => setSelectedAgent(prev => ({ ...prev, system_prompt: e.target.value }))}
                        placeholder="You are a helpful customer support assistant..."
                    />
                </div>
            </div>
        </div>
    )
}
