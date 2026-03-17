import { useState, useEffect, useRef } from 'react'
import { useAgentWiki, type Wiki } from '@/hooks/queries/useAgentWiki'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Save } from 'lucide-react'

export function KnowledgeBaseView({ workspaceId }: { workspaceId: string }) {
    const wiki = useAgentWiki(workspaceId)
    const [localWiki, setLocalWiki] = useState<Wiki | null>(null)
    const [isScraping, setIsScraping] = useState(false)
    const { toast } = useToast()
    const urlInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (wiki.data) setLocalWiki(wiki.data)
    }, [wiki.data])

    const saving = wiki.updateWiki.isPending || isScraping

    const handleSaveWiki = async () => {
        if (!localWiki || !workspaceId) return

        wiki.updateWiki.mutate(localWiki, {
            onSuccess: () => toast({ title: "Success", description: "Knowledge base saved." }),
            onError: (error) => toast({ title: "Error", description: error instanceof Error ? error.message : "Error", variant: "destructive" })
        })
    }

    if (!localWiki) return null

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
                        <p className="text-muted-foreground">Train your AI with business information</p>
                    </div>
                    <Button onClick={handleSaveWiki} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                <Card className="rounded-xl shadow-sm border-0 bg-white">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                            <div className="flex-1 flex gap-2">
                                <Input
                                    id="website-url"
                                    placeholder="https://yourwebsite.com"
                                    className="bg-white flex-1"
                                    ref={urlInputRef}
                                    aria-label="Website URL to import knowledge from"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        const url = urlInputRef.current?.value
                                        if (!url) {
                                            toast({ title: "Error", description: "Enter a URL", variant: "destructive" })
                                            return
                                        }
                                        setIsScraping(true)
                                        toast({ title: "Importing...", description: "Fetching website content" })
                                        try {
                                            const { data, error } = await supabase.functions.invoke('scrape-website', { body: { url } })
                                            if (error) throw error
                                            const content = `${data.title || 'Website'}\n${data.content || ''}`
                                            setLocalWiki(prev => prev ? { ...prev, business_info: prev.business_info ? `${prev.business_info}\n\n${content}` : content } : null)
                                            toast({ title: "Success", description: "Content imported!" })
                                            if (urlInputRef.current) urlInputRef.current.value = ''
                                        } catch (e) {
                                            const err = e as Error
                                            toast({ title: "Error", description: err.message, variant: "destructive" })
                                        } finally {
                                            setIsScraping(false)
                                        }
                                    }}
                                    disabled={saving}
                                >
                                    {isScraping ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Import Website"}
                                </Button>
                            </div>

                            <div className="flex items-center">
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".txt,.md,.pdf"
                                        aria-label="Upload document to knowledge base"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return

                                            if (file.type === 'application/pdf') {
                                                toast({ title: "Error", description: "PDF import not supported yet", variant: "destructive" })
                                                e.target.value = ''
                                                return;
                                            }

                                            setIsScraping(true)
                                            try {
                                                const text = await file.text()
                                                setLocalWiki(prev => prev ? { ...prev, business_info: prev.business_info ? `${prev.business_info}\n\n${file.name}\n${text}` : `${file.name}\n${text}` } : null)
                                                toast({ title: "Success", description: "File imported!" })
                                            } catch {
                                                toast({ title: "Error", description: "Failed to read file", variant: "destructive" })
                                            } finally {
                                                setIsScraping(false)
                                                e.target.value = ''
                                            }
                                        }}
                                    />
                                    <Button variant="outline" size="sm" asChild>
                                        <span>Upload File</span>
                                    </Button>
                                </label>
                            </div>
                        </div>

                            <div className="space-y-2">
                                <Label htmlFor="business-knowledge" className="text-sm font-medium">Your Business Knowledge</Label>
                                <p className="text-xs text-muted-foreground mb-2">
                                    Add all information your AI should know: company info, FAQs, policies, procedures, pricing, etc.
                                </p>
                                <textarea
                                    id="business-knowledge"
                                    className="flex min-h-[400px] w-full rounded-xl border border-input bg-white px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                                    value={localWiki.business_info || ''}
                                    onChange={(e) => setLocalWiki(prev => prev ? { ...prev, business_info: e.target.value } : null)}
                                    placeholder="Enter your business knowledge here."
                                />
                            </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
