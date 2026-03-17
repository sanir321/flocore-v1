import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface Workspace {
    id: string
    owner_id: string
    name: string
    slug?: string | null
    industry?: string | null
    timezone?: string | null
    escalation_enabled?: boolean | null
    created_at?: string
    updated_at?: string | null
    user?: {
        id: string
        email?: string
    }
}

interface WorkspaceContextType {
    workspace: Workspace | null
    loading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({
    children,
    value
}: {
    children: ReactNode
    value: WorkspaceContextType
}) {
    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    )
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext)
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider')
    }
    return context
}
