import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw, AlertTriangle, Home, ShieldCheck } from 'lucide-react'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <Card className="w-full max-w-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border-destructive/20 relative overflow-hidden rounded-[32px] bg-white">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-destructive"></div>
                        <CardHeader className="text-center pb-2 pt-8">
                            <div className="mx-auto w-16 h-16 bg-destructive/5 rounded-full flex items-center justify-center mb-6 text-destructive shadow-inner">
                                <AlertTriangle className="h-8 w-8" aria-hidden="true" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Something went wrong</CardTitle>
                            <CardDescription className="text-sm px-4">
                                An unexpected error occurred. Don't worry, your data is safe and our team has been notified.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4 text-center pb-8">
                            {this.state.error && (
                                <div className="bg-slate-50 p-4 rounded-xl text-left text-[11px] font-mono overflow-auto max-h-32 text-muted-foreground border border-slate-100 flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1 shrink-0" />
                                    {this.state.error.message}
                                </div>
                            )}
                            <div className="space-y-3">
                                <Button 
                                    onClick={this.handleReload} 
                                    className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" 
                                    variant="default"
                                    size="lg"
                                >
                                    <RefreshCcw className="mr-2 h-5 w-5" /> Reload application
                                </Button>
                                <Button 
                                    onClick={() => window.location.href = '/'} 
                                    className="w-full h-12 rounded-full font-semibold" 
                                    variant="outline"
                                    size="lg"
                                >
                                    <Home className="mr-2 h-4 w-4" /> Back to safety
                                </Button>
                            </div>

                            <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                SSL Secure Recovery
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}
