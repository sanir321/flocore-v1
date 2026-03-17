import { useState } from "react";
import { useEscalationRules, type EscalationRule } from '@/hooks/queries/useEscalationRules'
import { useConversations } from '@/hooks/queries/useConversations'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertTriangle, ChevronRight, Save, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useWorkspace } from '@/hooks/queries/useWorkspace'

export function EscalationCenterView({ workspaceId }: { workspaceId: string }) {
    const rules = useEscalationRules(workspaceId)
    const { data: workspace } = useWorkspace()
    const { data: escalatedData } = useConversations(workspaceId, { escalatedOnly: true })
    const { toast } = useToast()

    const [localEscalationRules, setLocalEscalationRules] = useState<EscalationRule[]>([])
    const [newKeyword, setNewKeyword] = useState('')
    const [prevRulesData, setPrevRulesData] = useState<EscalationRule[] | undefined>(rules.data)

    // Sync local rules when fetched rules change
    if (rules.data !== prevRulesData) {
        if (rules.data) setLocalEscalationRules(rules.data)
        setPrevRulesData(rules.data)
    }

    const handleSaveRules = async () => {
        if (!workspaceId) return
        rules.updateRules.mutate(localEscalationRules, {
            onSuccess: () => toast({ title: "Success", description: "Escalation rules saved." }),
            onError: (error) => toast({ title: "Error", description: error instanceof Error ? error.message : "Error", variant: "destructive" })
        })
    }

    const handleAddRule = () => {
        if (!newKeyword.trim() || !workspaceId) return
        if (localEscalationRules.some(r => r.keyword === newKeyword.trim().toLowerCase())) {
            toast({ title: "Error", description: "Keyword already exists", variant: "destructive" })
            return
        }
        const newRule: EscalationRule = {
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            keyword: newKeyword.trim().toLowerCase(),
            is_active: true,
            created_at: new Date().toISOString()
        }
        setLocalEscalationRules(prev => [...prev, newRule])
        setNewKeyword('')
    }

    const handleRemoveRule = (id: string) => {
        setLocalEscalationRules(prev => prev.filter(r => r.id !== id))
    }

    const handleToggleRule = (id: string, active: boolean) => {
        setLocalEscalationRules(prev => prev.map(r => r.id === id ? { ...r, is_active: active } : r))
    }

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Escalation Center</h1>
                        <p className="text-muted-foreground text-sm mt-1">Monitor and manage conversations flagged for human attention.</p>
                    </div>
                </div>

                {!workspace?.escalation_enabled && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="text-sm">
                            <span className="font-bold">Global Escalation is Disabled.</span> 
                            {" "}Agents will not automatically escalate conversations to this center until it's turned back on in the sidebar.
                        </div>
                    </div>
                )}

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
                    <span className="text-sm text-muted-foreground">{(escalatedData || []).length} escalations (filtered)</span>
                </div>

                <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-slate-50 rounded-t-lg border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div>Escalation</div>
                    <div>Type</div>
                    <div>Severity</div>
                    <div>Status</div>
                </div>

                {(escalatedData || []).length > 0 ? (
                    <div className="bg-white border rounded-b-lg overflow-hidden">
                        {(escalatedData || []).map(conv => (
                            <div key={conv.id} className="grid grid-cols-4 gap-4 px-4 py-4 border-b last:border-0 hover:bg-slate-50 transition-colors items-center">
                                <div>
                                    <div className="font-medium text-sm text-foreground">{conv.escalation_reason}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">ID: {conv.contact_id ? conv.contact_id.slice(0, 8) : 'Unknown'}...</div>
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

                <div className="mt-12">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-semibold">Automatic Escalation Rules</h2>
                            <p className="text-sm text-muted-foreground mt-1">Define keywords that should trigger an immediate escalation to a human.</p>
                        </div>
                        <Button onClick={handleSaveRules} disabled={rules.updateRules.isPending} className="bg-teal-600 hover:bg-teal-700">
                            <Save className="h-4 w-4 mr-2" />
                            {rules.updateRules.isPending ? "Saving..." : "Save Rules"}
                        </Button>
                    </div>

                    <Card className="border-0 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b">
                            <div className="flex gap-2">
                                <Input
                                    id="new-keyword"
                                    placeholder="Enter keyword (e.g. urgent, help, human)"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                    className="bg-white"
                                    aria-label="Enter new escalation keyword"
                                />
                                <Button onClick={handleAddRule} variant="secondary">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Keyword
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {localEscalationRules.length > 0 ? (
                                    localEscalationRules.map(rule => (
                                        <div key={rule.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center">
                                                    <AlertTriangle className="h-4 w-4 text-teal-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">"{rule.keyword}"</div>
                                                    <div className="text-xs text-muted-foreground">Triggers human escalation</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{rule.is_active ? 'Active' : 'Paused'}</span>
                                                    <Switch
                                                        checked={rule.is_active || false}
                                                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                                                        aria-label={`Toggle escalation rule for keyword ${rule.keyword}`}
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveRule(rule.id)}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground italic">
                                        No keywords defined. Add one above to start automating escalations.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
