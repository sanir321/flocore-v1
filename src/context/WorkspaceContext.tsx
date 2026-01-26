import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface Workspace {
    id: string
    owner_id: string
    // Add other workspace fields here as needed
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
