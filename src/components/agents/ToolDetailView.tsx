import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Tool } from '@/components/agents/types'

export function ToolDetailView({ tool, onBack }: { tool: Tool, onBack: () => void }) {
    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    aria-label="Back to Tools"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Tools
                </button>

                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">{tool.name}</h1>
                    <p className="text-sm text-muted-foreground">Configure which agents can access this internal tool</p>
                </div>

                <div className="border-b mb-8">
                    <div className="flex gap-8" role="tablist">
                        <button 
                            className="pb-3 border-b-2 border-primary text-sm font-medium"
                            role="tab"
                            aria-selected="true"
                        >
                            Information
                        </button>
                        <button 
                            className="pb-3 text-sm text-muted-foreground hover:text-foreground"
                            role="tab"
                            aria-selected="false"
                        >
                            Access
                        </button>
                    </div>
                </div>

                <div className="space-y-8 max-w-2xl">
                    <div>
                        <h3 className="font-medium mb-4">Tool Information</h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="tool-name" className="text-sm font-medium">Tool name</Label>
                                <Input id="tool-name" value={tool.name} disabled className="bg-slate-50 rounded-xl" />
                                <p className="text-xs text-muted-foreground">Internal tool names cannot be modified.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tool-description" className="text-sm font-medium">Description</Label>
                                <textarea
                                    id="tool-description"
                                    className="flex min-h-[100px] w-full rounded-xl border border-input bg-slate-50 px-4 py-3 text-sm resize-none"
                                    value={tool.description}
                                    disabled
                                />
                                <p className="text-xs text-muted-foreground">Internal tool descriptions are managed by the system.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="execution-message" className="text-sm font-medium">Execution Message</Label>
                                <Input id="execution-message" value={tool.executionMessage} disabled className="bg-slate-50 rounded-xl" />
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
                                    {tool.parameters.map(param => (
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
    )
}
