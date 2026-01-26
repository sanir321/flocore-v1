
import os

file_path = r"c:\Users\PC\Downloads\slice1\src\pages\AgentsPage.tsx"

# The new content block for the Dashboard
new_dashboard_block = """                {/* Escalations Dashboard View */}
                {viewMode === 'escalations' && (
                    <div className="p-8 h-full overflow-y-auto">
                        <div className="max-w-6xl mx-auto space-y-8">
                            {/* Header & Actions */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Escalation Center</h1>
                                    <div className="flex items-center gap-6 mt-4 border-b">
                                        <button className="text-sm font-medium border-b-2 border-foreground pb-2 px-1">Chat Escalations</button>
                                        <button className="text-sm font-medium text-muted-foreground pb-2 px-1 hover:text-foreground transition-colors">Voice Escalations</button>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-9 gap-2 bg-white hover:bg-slate-50 text-xs font-medium"
                                    onClick={() => setViewMode('escalation-settings')}
                                >
                                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                                    Configure Rules
                                </Button>
                            </div>

                            {/* Metrics Cards - Professional/Minimal */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card className="p-5 shadow-sm border bg-white rounded-xl">
                                    <div className="space-y-1">
                                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total Escalations</p>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <h2 className="text-3xl font-light text-foreground">{escalationStats.total}</h2>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-5 shadow-sm border bg-white rounded-xl">
                                    <div className="space-y-1">
                                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Pending Review</p>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <h2 className="text-3xl font-light text-foreground">{escalationStats.pending}</h2>
                                            {escalationStats.pending > 0 && <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>}
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-5 shadow-sm border bg-white rounded-xl">
                                    <div className="space-y-1">
                                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Resolved</p>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <h2 className="text-3xl font-light text-foreground">{escalationStats.resolved}</h2>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-5 shadow-sm border bg-white rounded-xl">
                                    <div className="space-y-1">
                                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Dismissed</p>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <h2 className="text-3xl font-light text-muted-foreground">{escalationStats.dismissed}</h2>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            
                            {/* Empty State / List Placeholder */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">Recent Activity</h3>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">Filter</Button>
                                    </div>
                                </div>

                                {escalationStats.total === 0 ? (
                                    <Card className="shadow-none border border-dashed bg-slate-50/50 min-h-[300px] flex items-center justify-center rounded-xl">
                                        <div className="text-center p-8">
                                            <div className="h-12 w-12 bg-white rounded-full border border-dashed flex items-center justify-center mx-auto mb-3">
                                                <Sparkles className="h-5 w-5 text-muted-foreground/50" />
                                            </div>
                                            <h3 className="text-sm font-medium text-foreground mb-1">No escalations yet</h3>
                                            <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
                                                When AI detects an issue requiring human attention, it will appear here.
                                            </p>
                                        </div>
                                    </Card>
                                ) : (
                                    <Card className="shadow-sm border bg-white rounded-xl overflow-hidden">
                                        <div className="p-12 text-center text-sm text-muted-foreground">
                                             {/* Placeholder for list content - straightforward simple list would go here */}
                                             List of {escalationStats.total} escalations...
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                )}
"""

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the START of the current Dashboard Block and the END of it.
# The current block starts with: {viewMode === 'escalations' && (
# And ends before: {viewMode === 'escalation-settings' && escalationRules && (

# Start Marker
start_marker = "{viewMode === 'escalations' && ("
end_marker = "{/* Escalation Settings View (Old View) */}" 

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

# Because we added a comment "{/* Escalations Dashboard View */}" before the start marker in previous step,
# We should probably look for THAT.
comment_marker = "{/* Escalations Dashboard View */}"
real_start = content.find(comment_marker)
if real_start != -1:
    start_idx = real_start

if start_idx != -1 and end_idx != -1:
    # Construct new file content
    new_content = content[:start_idx] + new_dashboard_block + "\n\n                " + content[end_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success: Updated Dashboard UI")
else:
    print("Error: Could not find block boundaries")
    print(f"Start: {start_idx}, End: {end_idx}")
