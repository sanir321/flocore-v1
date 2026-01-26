
import { useEffect, useState } from 'react'
import { useWorkspace } from '@/context/WorkspaceContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit2, Book, Search, FileText, Sparkles } from 'lucide-react'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
import { useToast } from '@/hooks/use-toast'

interface KnowledgeDoc {
    id: string
    title: string
    content: string
    created_at: string | null
}

export default function KnowledgeBasePage() {
    const { workspace, loading: workspaceLoading } = useWorkspace()
    const { toast } = useToast()
    const [docs, setDocs] = useState<KnowledgeDoc[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingDoc, setEditingDoc] = useState<KnowledgeDoc | null>(null)
    const [formData, setFormData] = useState({ title: '', content: '' })

    useEffect(() => {
        if (workspace?.id) fetchDocs()
    }, [workspace?.id])

    const fetchDocs = async () => {
        if (!workspace?.id) return
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .eq('workspace_id', workspace.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching docs:', error)
        } else {
            setDocs(data || [])
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!workspace?.id || !formData.title.trim() || !formData.content.trim()) return

        try {
            if (editingDoc) {
                const { error } = await supabase
                    .from('knowledge_base')
                    .update({ title: formData.title, content: formData.content })
                    .eq('id', editingDoc.id)

                if (error) throw error
                toast({ title: 'Updated', description: 'Document updated successfully.' })
            } else {
                const { error } = await supabase
                    .from('knowledge_base')
                    .insert({
                        workspace_id: workspace.id,
                        title: formData.title,
                        content: formData.content
                    })

                if (error) throw error
                toast({ title: 'Created', description: 'Document created successfully.' })
            }

            setIsDialogOpen(false)
            setFormData({ title: '', content: '' })
            setEditingDoc(null)
            fetchDocs()
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return

        const { error } = await supabase.from('knowledge_base').delete().eq('id', id)
        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        } else {
            toast({ title: 'Deleted', description: 'Document deleted.' })
            setDocs(prev => prev.filter(d => d.id !== id))
        }
    }

    const openEdit = (doc: KnowledgeDoc) => {
        setEditingDoc(doc)
        setFormData({ title: doc.title, content: doc.content })
        setIsDialogOpen(true)
    }

    const openNew = () => {
        setEditingDoc(null)
        setFormData({ title: '', content: '' })
        setIsDialogOpen(true)
    }

    const filteredDocs = docs.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (workspaceLoading || loading) return <FlowCoreLoader />

    return (
        <div className="flex-1 h-full flex flex-col p-6 space-y-6 overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
                    <p className="text-muted-foreground">Manage documents that the AI uses to answer questions.</p>
                </div>
                <Button onClick={openNew} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Document
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                {/* Placeholder for future features */}
                <Button variant="outline" size="sm" className="gap-2" disabled>
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto-Generate
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-10">
                {filteredDocs.length === 0 ? (
                    <div className="col-span-full py-20 text-center border rounded-lg bg-muted/20 border-dashed">
                        <Book className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No documents yet</h3>
                        <p className="text-muted-foreground mb-4">Add documents to train your AI agent.</p>
                        <Button variant="outline" onClick={openNew}>Create First Document</Button>
                    </div>
                ) : (
                    filteredDocs.map(doc => (
                        <Card key={doc.id} className="group hover:shadow-md transition-all relative">
                            <CardHeader className="status-indicator">
                                <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    {doc.title}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown Date'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 h-[4.5em]">
                                    {doc.content}
                                </p>
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(doc)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(doc.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingDoc ? 'Edit Document' : 'New Document'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 space-y-4 py-4 overflow-y-auto">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g. Return Policy"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label>Content</Label>
                            <Textarea
                                placeholder="Enter the detailed information..."
                                className="min-h-[300px] font-mono text-sm leading-relaxed"
                                value={formData.content}
                                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Document</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
