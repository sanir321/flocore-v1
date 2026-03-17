export interface Tool {
    id: string
    name: string
    description: string
    executionMessage: string
    parameters: { name: string; type: string; required: boolean; description: string }[]
}
