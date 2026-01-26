
import os

file_path = r"c:\Users\PC\Downloads\slice1\src\pages\AgentsPage.tsx"

new_content_block = """                {/* Escalations Dashboard View */}
                {viewMode === 'escalations' && (
                    <div className="p-6 h-full overflow-y-auto">
                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Header & Actions */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight">Escalation Center</h1>
                                    <div className="flex items-center gap-4 mt-2">
                                        <button className="text-sm font-medium border-b-2 border-primary pb-1">Chat</button>
                                        <button className="text-sm font-medium text-muted-foreground pb-1 hover:text-foreground">Voice</button>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 gap-2"
                                    onClick={() => setViewMode('escalation-settings')}
                                >
                                    <Settings className="h-3.5 w-3.5" />
                                    Configure Rules
                                </Button>
                            </div>

                            {/* Metrics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="p-4 shadow-sm border-0 bg-white">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Escalations</p>
                                        <div className="flex items-baseline gap-2">
                                            <h2 className="text-3xl font-bold text-foreground">24</h2>
                                            <span className="text-xs text-emerald-600 font-medium">+12%</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">All time escalations</p>
                                    </div>
                                </Card>
                                <Card className="p-4 shadow-sm border-0 bg-white">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending Review</p>
                                        <div className="flex items-baseline gap-2">
                                            <h2 className="text-3xl font-bold text-orange-600">3</h2>
                                            <span className="text-xs text-orange-600 font-medium">Needs attention</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Requires human action</p>
                                    </div>
                                </Card>
                                <Card className="p-4 shadow-sm border-0 bg-white">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Resolved</p>
                                        <div className="flex items-baseline gap-2">
                                            <h2 className="text-3xl font-bold text-blue-600">18</h2>
                                            <span className="text-xs text-blue-600 font-medium">Successfully handled</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Closed tickets</p>
                                    </div>
                                </Card>
                                <Card className="p-4 shadow-sm border-0 bg-white">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dismissed</p>
                                        <div className="flex items-baseline gap-2">
                                            <h2 className="text-3xl font-bold text-slate-500">3</h2>
                                            <span className="text-xs text-slate-500 font-medium">Not actionable</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">False positives</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Escalation Types Chart */}
                                <Card className="p-0 shadow-sm border-0 bg-white overflow-hidden">
                                    <CardHeader className="py-3 px-4 border-b bg-slate-50/50">
                                        <CardTitle className="text-sm font-semibold">Escalation Types</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 flex items-center justify-center min-h-[250px]">
                                        <div className="relative h-40 w-40 rounded-full" style={{ background: 'conic-gradient(#ef4444 0% 35%, #3b82f6 35% 60%, #10b981 60% 85%, #f59e0b 85% 100%)' }}>
                                            <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                                                <span className="text-2xl font-bold">24</span>
                                                <span className="text-[10px] text-muted-foreground text-center">Total<br/>Events</span>
                                            </div>
                                        </div>
                                        <div className="ml-8 space-y-2">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                <span className="text-muted-foreground">Angry Language (35%)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                <span className="text-muted-foreground">Pricing Disputes (25%)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                <span className="text-muted-foreground">Human Request (25%)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                <span className="text-muted-foreground">Other (15%)</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Escalation Rate Chart */}
                                <Card className="p-0 shadow-sm border-0 bg-white overflow-hidden">
                                     <CardHeader className="py-3 px-4 border-b bg-slate-50/50 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-semibold">Escalation Rate</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-muted-foreground">0.0%</span>
                                            <select className="text-xs bg-transparent border-none text-muted-foreground focus:ring-0 cursor-pointer outline-none">
                                                <option>Last 7 days</option>
                                                <option>Last 30 days</option>
                                            </select>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 min-h-[250px] relative">
                                        <div className="absolute top-6 left-6 text-sm font-medium text-muted-foreground">
                                            0.0% <span className="text-xs font-normal text-muted-foreground ml-1">previous period</span>
                                        </div>
                                        <div className="h-full flex items-end justify-between pt-12 pb-2 gap-2">
                                            {[20, 45, 30, 60, 40, 75, 50].map((h, i) => (
                                                <div key={i} className="w-full bg-blue-50 rounded-t-sm relative group h-32 flex items-end">
                                                    <div 
                                                        className="w-full bg-blue-500/80 rounded-t-sm transition-all duration-500 hover:bg-blue-600"
                                                        style={{ height: `${h}%` }}
                                                    ></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground mt-2 border-t pt-2">
                                            <span>Jan 19</span>
                                            <span>Today</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Escalation List */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="h-7 text-xs bg-white">All Types</Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs bg-white">Pending</Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs bg-white ml-auto">Newest First</Button>
                                </div>
                                
                                <Card className="shadow-sm border-0 bg-white min-h-[300px] flex items-center justify-center">
                                    <div className="text-center p-8">
                                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                                            <div className="h-12 w-12 bg-white rounded-md shadow-sm flex items-center justify-center transform -rotate-6 absolute left-3 top-3 border">
                                                <AlertTriangle className="h-5 w-5 text-slate-300" />
                                            </div>
                                            <div className="h-12 w-12 bg-white rounded-md shadow-sm flex items-center justify-center transform rotate-6 absolute right-3 bottom-3 border z-10">
                                                <AlertTriangle className="h-5 w-5 text-slate-400" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-medium text-foreground mb-1">No escalations found</h3>
                                        <p className="text-sm text-muted-foreground">Adjust your filters or date range to see escalations</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* Escalation Settings View (Old View) */}
                {viewMode === 'escalation-settings' && escalationRules && (
                    <div className="p-8">
                        <div className="max-w-3xl mx-auto">
                            <button
                                onClick={() => setViewMode('escalations')}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Dashboard
                            </button>

                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-lg font-bold tracking-tight">Escalation Rules</h1>
                                    <p className="text-muted-foreground text-xs mt-1">Configure when AI should hand over to a human.</p>
                                </div>
                                <Button size="sm" onClick={handleSaveRules} disabled={saving} className="h-8 text-xs gap-2">
                                    <Save className="h-3.5 w-3.5" />
                                    {saving ? "Saving..." : "Save Rules"}
                                </Button>
                            </div>

                            <div className="space-y-3">
""" + """
                                <Card className="border shadow-sm rounded-lg overflow-hidden transition-all hover:bg-slate-50/30">
                                    <div className="p-4 flex items-start gap-4">
                                        <div className="h-8 w-8 rounded-md bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h3 className="font-semibold text-sm">Angry Language</h3>
                                                <div className="scale-75 origin-right">
                                                    <Switch
                                                        checked={escalationRules.angry_language}
                                                        onCheckedChange={(c) => setEscalationRules(prev => prev ? { ...prev, angry_language: c } : null)}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Trigger escalation when customer uses profanity, shouting, or hostile keywords.
                                            </p>
                                            
                                            {escalationRules.angry_language && (
                                                <div className="bg-slate-50 p-2 rounded border text-[10px] text-muted-foreground flex gap-2 items-center">
                                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                    <span className="font-mono">Detects: "stupid", "hate", "angry", "moron", "useless"...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border shadow-sm rounded-lg overflow-hidden transition-all hover:bg-slate-50/30">
                                    <div className="p-4 flex items-start gap-4">
                                        <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                                            <Briefcase className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h3 className="font-semibold text-sm">Pricing Disputes</h3>
                                                <div className="scale-75 origin-right">
                                                    <Switch
                                                        checked={escalationRules.pricing_dispute}
                                                        onCheckedChange={(c) => setEscalationRules(prev => prev ? { ...prev, pricing_dispute: c } : null)}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Trigger escalation when conversation involves refunds, pricing complaints, or billing errors.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border shadow-sm rounded-lg overflow-hidden transition-all hover:bg-slate-50/30">
                                    <div className="p-4 flex items-start gap-4">
                                        <div className="h-8 w-8 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h3 className="font-semibold text-sm">Human Request</h3>
                                                <div className="scale-75 origin-right">
                                                    <Switch
                                                        checked={escalationRules.human_request}
                                                        onCheckedChange={(c) => setEscalationRules(prev => prev ? { ...prev, human_request: c } : null)}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Immediately escalate if the user asks to "speak to a person" or "human".
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
"""

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Marker for start of replacement
start_marker = "{/* Escalations View */}"
end_marker = "{/* Escalation Settings View (Old View) */}" # This won't exist yet, we need to replace the whole block

# Alternative strategy: Find the block by its content structure
block_start = content.find("{/* Escalations View */}")
if block_start == -1:
    print("Could not find start marker")
    exit(1)

# Find the end of the block. It ends before the closing </div> of the component, or the next 'View'.
# We know the next lines after the block are:
#             </div>
#         </div>
#     )
# }

# We can find the closing of the condition.
# The block starts with: {viewMode === 'escalations' && escalationRules && (
# It ends with: )}

# Let's count braces to find the matching closing brace for the one starting at block_start + ...
# Brittle.

# Better: finding the NEXT view or the end of the container.
# In the original file, Escalations View is the LAST view.
# So it ends before line 1089 (</div>).

# Let's find the end of the file/component structure.
file_end_marker = "            </div>\n        </div>\n    )\n}"
# This might be affected by whitespace.

# Let's look for the indentation of the closing brace of the Escalations View block.
# It should be "                )}" around line 1088.

# Let's try to match the exact string we want to replace from the file read.
# We will use a unique substring from the start and end.
start_str = "{/* Escalations View */}"
end_str = "detects: \"stupid\", \"hate\"" # something inside

# Actually, I'll just look for the block start and the closing `)}` before the final `</div>`.
block_end_search_start = block_start + 100
# Find the last occurrence of `)}` before the end of the file? No.

# Let's use the explicit structure we saw in view_file.
# It ends at line 1088 with `                )}`
# The file ends at 1094.
# So we can search backwards from the end.

# Let's try to identify the range.
lines = content.split('\n')
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{/* Escalations View */}" in line:
        start_idx = i
    if start_idx != -1 and line.strip() == ")}" and i > start_idx:
        # Check indentation to be safe?
        # In the file it was: "                )}"
        if line.startswith("                )}"):
             end_idx = i
             break

if start_idx != -1 and end_idx != -1:
    print(f"Replacing lines {start_idx+1} to {end_idx+1}")
    new_lines = lines[:start_idx] + new_content_block.split('\n') + lines[end_idx+1:]
    new_content = '\n'.join(new_lines)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print("Could not find block boundaries")
    # Dump some context
    print(f"Start index: {start_idx}")
