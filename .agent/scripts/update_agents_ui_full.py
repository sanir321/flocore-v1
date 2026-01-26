
import os
import re

file_path = r"c:\Users\PC\Downloads\slice1\src\pages\AgentsPage.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# --- REPLACEMENT 1: AGENT GRID (Chat Agents) ---
# We want to replace the "Decoration Pattern" and the colorful icons with a minimal design.

grid_start_marker = "{/* Chat Agents Grid View */}"
# We'll replace the whole block down to the start of Agent Detail View.
# Matches from {viewMode === 'chat-agents' ... to before {viewMode === 'agent-detail'

new_grid_ui = """                {/* Chat Agents Grid View */}
                {viewMode === 'chat-agents' && (
                    <div className="p-8">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chat Agents</h1>
                                    <p className="text-muted-foreground text-sm mt-1">Manage AI assistants that handle customer conversations.</p>
                                </div>
                                <Button size="sm" variant="outline" className="h-9 text-xs gap-2 bg-white hover:bg-slate-50">
                                    <Plus className="h-3.5 w-3.5" />
                                    New Agent
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {agents.map(agent => (
                                    <button
                                        key={agent.id}
                                        onClick={() => handleAgentClick(agent)}
                                        className="group text-left relative bg-white rounded-xl border shadow-sm hover:border-foreground/20 hover:shadow-md transition-all duration-300"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="h-12 w-12 rounded-full border bg-slate-50 flex items-center justify-center text-foreground/70 group-hover:bg-slate-100 transition-colors">
                                                    {agent.name.toLowerCase().includes('sales') ? (
                                                        <Briefcase className="h-5 w-5" />
                                                    ) : agent.name.toLowerCase().includes('booking') ? (
                                                        <Clock className="h-5 w-5" />
                                                    ) : agent.name.toLowerCase().includes('support') ? (
                                                        <MessageSquare className="h-5 w-5" />
                                                    ) : (
                                                        <Bot className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wide",
                                                    agent.active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-muted-foreground border-slate-100"
                                                )}>
                                                    {agent.active ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>

                                            <h3 className="font-semibold text-base mb-1 text-foreground">{agent.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
                                                {agent.system_prompt.slice(0, 80)}...
                                            </p>
                                        </div>
                                        <div className="px-6 py-3 border-t bg-slate-50/30 rounded-b-xl flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-foreground/20"></span>
                                                {agent.model.split('-')[0].capitalize()}
                                            </span>
                                            <span className="group-hover:translate-x-0.5 transition-transform">Configure →</span>
                                        </div>
                                    </button>
                                ))}
                                
                                {/* Add New Card */}
                                <button className="group relative bg-slate-50 rounded-xl border border-dashed hover:border-foreground/30 hover:bg-slate-100/50 transition-all duration-300 flex flex-col items-center justify-center gap-3 min-h-[180px]">
                                    <div className="h-10 w-10 rounded-full bg-white border shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Create New Agent</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
"""

# Find grid start
start_grid = content.find(grid_start_marker)
# Find start of next view (Agent Detail)
next_view_marker = "{/* Agent Detail View (Existing Editor) */}"
end_grid = content.find(next_view_marker)

if start_grid != -1 and end_grid != -1:
    content = content[:start_grid] + new_grid_ui + "\n" + content[end_grid:]
    print("Updated Grid View")
else:
    print("Warning: Could not update Grid View")


# --- REPLACEMENT 2: KNOWLEDGE BASE ---
kb_start_marker = "{/* Knowledge Base View */}"
new_kb_ui = """                {/* Knowledge Base View */}
                {viewMode === 'knowledge-base' && wiki && (
                    <div className="p-8">
                        <div className="max-w-5xl mx-auto space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Knowledge Base</h1>
                                    <p className="text-muted-foreground text-sm mt-1">Manage the intelligence source for your agents.</p>
                                </div>
                                <Button onClick={handleSaveWiki} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 h-9 text-xs">
                                    <Save className="h-3.5 w-3.5 mr-2" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Data Sources */}
                                <div className="space-y-6">
                                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Data Sources</h2>

                                    {/* Website Import Card */}
                                    <Card className="rounded-xl border shadow-none hover:border-foreground/20 transition-all">
                                        <CardHeader className="bg-transparent pb-3 pt-5 px-5 border-b-0">
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
                                        <CardContent className="p-5 pt-0 space-y-3">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="https://example.com"
                                                    className="bg-white text-xs h-9"
                                                    id="website-url"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-9 px-3 text-xs bg-slate-100 hover:bg-slate-200"
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
                                                            const { data, error } = await api.scrapeWebsite({ url })
                                                            if (error) throw error
                                                            setWiki(prev => prev ? {
                                                                ...prev,
                                                                business_info: (prev.business_info ? prev.business_info + '\\n\\n' : '') + `=== SCOPED FROM ${url} ===\\nTitle: ${data.title}\\n${data.content}`
                                                            } : null)
                                                            toast({ title: "Success", description: "Content added to Business Info." })
                                                        } catch (error: any) {
                                                            toast({ title: "Error", description: error.message, variant: "destructive" })
                                                        } finally {
                                                            setSaving(false)
                                                        }
                                                    }}
                                                    disabled={saving}
                                                >
                                                    Fetch
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* File Upload Card */}
                                    <Card className="rounded-xl border shadow-none hover:border-foreground/20 transition-all">
                                        <CardHeader className="bg-transparent pb-3 pt-5 px-5 border-b-0">
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
                                        <CardContent className="p-5 pt-0">
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
                                    <Tabs defaultValue="business" className="w-full">
                                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                                            {['business', 'faqs', 'procedures'].map(tab => (
                                                <TabsTrigger 
                                                    key={tab}
                                                    value={tab}
                                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none px-1 pb-3 text-xs uppercase tracking-wide text-muted-foreground transition-all"
                                                >
                                                    {tab === 'business' ? 'Business Info' : tab === 'faqs' ? 'FAQs' : 'Procedures'}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>

                                        <TabsContent value="business" className="mt-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Core Business Knowledge</Label>
                                                <Textarea
                                                    className="min-h-[400px] font-mono text-sm leading-relaxed bg-white border-slate-200 resize-none focus-visible:ring-1 focus-visible:ring-foreground"
                                                    placeholder="# Business Overview..."
                                                    value={wiki.business_info || ''}
                                                    onChange={(e) => setWiki(prev => prev ? { ...prev, business_info: e.target.value } : null)}
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="faqs" className="mt-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Frequently Asked Questions</Label>
                                                <Textarea
                                                    className="min-h-[400px] font-mono text-sm leading-relaxed bg-white border-slate-200 resize-none focus-visible:ring-1 focus-visible:ring-foreground"
                                                    placeholder="Q: What are your hours?\\nA: We are open 9-5..."
                                                    value={wiki.faqs || ''}
                                                    onChange={(e) => setWiki(prev => prev ? { ...prev, faqs: e.target.value } : null)}
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="procedures" className="mt-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Standard Operating Procedures</Label>
                                                <Textarea
                                                    className="min-h-[400px] font-mono text-sm leading-relaxed bg-white border-slate-200 resize-none focus-visible:ring-1 focus-visible:ring-foreground"
                                                    placeholder="1. Verify customer ID..."
                                                    value={wiki.procedures || ''}
                                                    onChange={(e) => setWiki(prev => prev ? { ...prev, procedures: e.target.value } : null)}
                                                />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
"""

# Replace Knowledge Base
start_kb = content.find(kb_start_marker)
# It's the last major block before the footer closing.
# The previous step inserted Escalations Settings BEFORE it? No, Escalations Settings replaced Escalations View?
# Wait, KB view is AFTER Escalations settings in the file structure I saw earlier? 
# view_file showed: KB at the end.
# But I added Escalation Settings via replace script.

# Let's find end of KB block. 
# It ends with closing brace before the final </div>s.
if start_kb != -1:
    footer_str = "            </div>\\n        </div>\\n    )\\n}"
    # Use rfind to find the footer
    
    # We can just match the end of the file structure basically.
    # The KB block is: {viewMode === 'knowledge-base' ... )}
    
    # Let's try to match the closing `)}` corresponding to the start.
    # I'll replace everything from start_kb to the last `)}` before the footer.
    
    # Look for the footer structure from the end
    end_of_app = content.rfind("</div>")
    # Go back a bit.
    
    # Safer: Regex replace for the KB block if possible, or just exact string match of the header line if present.
    # I'll assume the KB block goes until the end of the functional JSX.
    
    # Currently:
    # ...
    # {viewMode === 'knowledge-base' ...
    # </div>
    # )}
    # 
    # </div>
    # </div>
    # )
    # }
    
    # Let's find the `)}` that closes the KB block.
    # It is likely the last `)}` in the file.
    last_closing = content.rfind(")}")
    
    if last_closing > start_kb:
         content = content[:start_kb] + new_kb_ui + content[last_closing+2:]
         print("Updated Knowledge Base View")
    else:
         print("Warning: Could not find end of KB View")
else:
    print("Warning: Could not locate KB View")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
