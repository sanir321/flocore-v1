
import os

file_path = r"c:\Users\PC\Downloads\slice1\src\pages\AgentsPage.tsx"

new_settings_content = """                {/* Escalation Settings View */}
                {viewMode === 'escalation-settings' && escalationRules && (
                    <div className="p-8">
                        <div className="max-w-2xl mx-auto">
                            <button
                                onClick={() => setViewMode('escalations')}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Dashboard
                            </button>

                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Escalation Rules</h1>
                                    <p className="text-muted-foreground text-xs mt-1.5 font-normal">Define triggers that automatically escalate conversations to human support.</p>
                                </div>
                                <Button size="sm" onClick={handleSaveRules} disabled={saving} className="h-8 text-xs gap-2 bg-foreground text-background hover:bg-foreground/90">
                                    <Save className="h-3.5 w-3.5" />
                                    {saving ? "Saving..." : "Save Rules"}
                                </Button>
                            </div>

                            <div className="space-y-4">

                                <Card className="border shadow-none rounded-xl hover:border-foreground/20 transition-all duration-300">
                                    <div className="p-5 flex items-start gap-5">
                                        <div className="h-10 w-10 rounded-full border bg-slate-50 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-medium text-sm text-foreground">Angry Language</h3>
                                                <Switch
                                                    checked={escalationRules.angry_language}
                                                    onCheckedChange={(c) => setEscalationRules(prev => prev ? { ...prev, angry_language: c } : null)}
                                                    className="data-[state=checked]:bg-foreground"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                                Detects hostility, shouting, or profanity using sentiment analysis.
                                            </p>
                                            
                                            {escalationRules.angry_language && (
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50 text-[10px] text-muted-foreground flex gap-2 items-center">
                                                    <Sparkles className="h-3 w-3 text-foreground/40" />
                                                    <span className="font-mono opacity-80">Triggers: excessive keywords, negative sentiment score &lt; 0.3</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border shadow-none rounded-xl hover:border-foreground/20 transition-all duration-300">
                                    <div className="p-5 flex items-start gap-5">
                                        <div className="h-10 w-10 rounded-full border bg-slate-50 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                                            <Briefcase className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-medium text-sm text-foreground">Pricing Disputes</h3>
                                                <Switch
                                                    checked={escalationRules.pricing_dispute}
                                                    onCheckedChange={(c) => setEscalationRules(prev => prev ? { ...prev, pricing_dispute: c } : null)}
                                                    className="data-[state=checked]:bg-foreground"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Escalates when the user contests billing, asks for refunds, or questions pricing tiers.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border shadow-none rounded-xl hover:border-foreground/20 transition-all duration-300">
                                    <div className="p-5 flex items-start gap-5">
                                        <div className="h-10 w-10 rounded-full border bg-slate-50 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-medium text-sm text-foreground">Human Request</h3>
                                                <Switch
                                                    checked={escalationRules.human_request}
                                                    onCheckedChange={(c) => setEscalationRules(prev => prev ? { ...prev, human_request: c } : null)}
                                                    className="data-[state=checked]:bg-foreground"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Bypasses AI immediately if the user explicitly asks to speak with a person.
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

# Locate the Escalation Settings block
start_marker = "                {viewMode === 'escalation-settings' && escalationRules && ("
end_marker = "                )}"

# Finding the specific block at the end of the file.
# Note: we should look for the block we saw in view_file (lines 1150-1249)

# Strategy: Find start, find matching closing brace? Or just replace until a known footer?
# The settings block is the last one inside the main div container.

start_idx = content.find(start_marker)

if start_idx != -1:
    # We need to find where this block ends.
    # It ends before the closing of the component.
    # Let's search for the closing tag </div> indentation logic is risky.
    # The block ends with "                )}"
    # Let's find the LAST occurrence of "                )}" in the file, which should be this one (since it's the last view).
    
    # Actually, let's just use the fact that it is followed by </div>\n        </div> inside the return.
    
    footer_str = "            </div>\n        </div>\n    )\n}"
    end_idx = content.rfind(footer_str)
    
    # We want to replace from start_idx to the line before footer_str
    # But wait, footer_str starts with closing the parent div.
    # The block itself runs until it closes its condition.
    
    # Let's look for the next line after start_idx that contains 1250's content which is empty line
    # or just use the structure.
    
    # Safe match: Find the start using unique string, find the end using unique string from the file we just viewed.
    # End unique string: "Immediately escalate if the user asks to \"speak to a person\" or \"human\"."
    # Then find the closing tags after that.
    
    unique_content_end = 'Immediately escalate if the user asks to "speak to a person" or "human".'
    content_end_pos = content.find(unique_content_end)
    
    if content_end_pos != -1:
        # Find the closing block `)}` after this position
        block_end_pos = content.find(")}", content_end_pos)
        if block_end_pos != -1:
            # Include the `)}` in replacement? No, the replacement includes it?
            # My replacement string ends with `)}`.
            # So we replace up to block_end_pos + 2
            
            # Check indentation of `)}`
            # In file: "                )}"
            
            final_cutoff = block_end_pos + 2
            
            # Construct new content
            new_full_content = content[:start_idx] + new_settings_content + content[final_cutoff:]
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_full_content)
            print("Success: Updated Settings UI")
            exit(0)

print("Error: Could not find block boundaries")
