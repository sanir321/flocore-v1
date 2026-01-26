import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

export default function SignInForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { toast } = useToast()

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            navigate('/inbox')
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Sign in to Flowcore</h1>
                <p className="text-zinc-400">Welcome back! Please sign in to continue</p>
            </div>

            <div className="space-y-4">
                <Button variant="outline" className="w-full h-12 bg-white text-zinc-900 hover:bg-zinc-100 border-0 font-medium text-base rounded-lg flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0A0A0A] px-2 text-zinc-500">or</span>
                    </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email address"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-zinc-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-zinc-700"
                        />
                    </div>

                    <Button type="submit" className="w-full h-12 bg-[#c25e2e] hover:bg-[#a94f24] text-white font-medium rounded-lg shadow-lg shadow-orange-900/20 text-base mt-2" disabled={loading}>
                        {loading ? "Signing in..." : "Login"}
                    </Button>
                </form>

                <div className="text-center text-sm text-zinc-500 mt-6">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-zinc-300 hover:text-white font-medium transition-colors">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    )
}
