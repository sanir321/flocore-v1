import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

interface Step3Props {
    data: {
        name: string
        industry: string
        timezone: string
        support_enabled: boolean
        appointments_enabled: boolean
    }
    onBack: () => void
}

export default function Step3AgentSetup({ data, onBack }: Step3Props) {
    const { user } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const handleComplete = async () => {
        if (!user) {
            toast({
                title: "Please sign in first",
                description: "You need to create an account before launching your workspace.",
                variant: "destructive"
            })
            navigate('/signup')
            return
        }
        setLoading(true)

        try {
            // 1. Create Workspace
            const { data: workspace, error: wsError } = await supabase
                .from('workspaces')
                .insert({
                    name: data.name,
                    industry: data.industry,
                    timezone: data.timezone,
                    owner_id: user.id
                })
                .select()
                .single()

            if (wsError) throw wsError

            // 2. Initialize Workspace Resources (Agents, Wiki, Use Cases)
            const { error: fnError } = await supabase.rpc('initialize_workspace', {
                p_workspace_id: workspace.id,
                p_support_enabled: data.support_enabled,
                p_appointments_enabled: data.appointments_enabled
            })

            if (fnError) throw fnError

            toast({
                title: "Workspace Created!",
                description: "Redirecting to dashboard...",
            })

            navigate('/')

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Review & Launch</CardTitle>
                <CardDescription>Ready to set up your AI workspace?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <h3 className="font-semibold">Business</h3>
                    <p className="text-sm text-muted-foreground">{data.name} ({data.industry})</p>
                </div>
                <div className="grid gap-2">
                    <h3 className="font-semibold">Agents</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {data.support_enabled && <li>Support Agent</li>}
                        {data.appointments_enabled && <li>Appointment Booker Agent</li>}
                        {!data.support_enabled && !data.appointments_enabled && <li>None selected (Manual mode)</li>}
                    </ul>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onBack} disabled={loading}>Back</Button>
                <Button onClick={handleComplete} disabled={loading}>
                    {loading ? "Initializing..." : "Launch Workspace"}
                </Button>
            </CardFooter>
        </Card>
    )
}
