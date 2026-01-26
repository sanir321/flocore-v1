import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

export default function SignUpForm() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { toast } = useToast()

    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'details' | 'verify'>('details')
    const [resendTimer, setResendTimer] = useState(0)

    // Timer effect
    if (resendTimer > 0) {
        setTimeout(() => setResendTimer(resendTimer - 1), 1000)
    }

    const checkRateLimit = (error: any) => {
        if (error?.message?.includes('rate limit')) {
            return 'Too many requests. Please wait a moment.'
        }
        if (error?.message?.includes('User already registered')) {
            return 'User already registered. Please sign in.'
        }
        return error?.message || 'An error occurred'
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.id]: e.target.value
        }))
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone
                    }
                }
            })

            if (error) throw error

            toast({
                title: "Verification code sent",
                description: "Please check your email for the OTP."
            })

            setStep('verify')
            setResendTimer(60)

        } catch (error) {
            const errorMsg = checkRateLimit(error)

            // UX Improvement: If rate limited, it means we effectively sent a code recently.
            // Let the user proceed to entered it instead of blocking them.
            if (errorMsg.includes('Too many requests')) {
                toast({
                    title: "Code already sent",
                    description: "You requested a code recently. Please check your inbox.",
                    duration: 5000
                })
                setStep('verify')
                setResendTimer(60)
            } else {
                toast({
                    title: "Error",
                    description: errorMsg,
                    variant: "destructive"
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (resendTimer > 0) return

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: formData.email,
            })
            if (error) throw error

            toast({
                title: "Code rescinded",
                description: "A new verification code has been sent."
            })
            setResendTimer(60)

        } catch (error) {
            console.error("Resend error:", error)
            toast({
                title: "Resend failed",
                description: checkRateLimit(error),
                variant: "destructive"
            })
        }
    }

    const handleVerifyParams = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const token = otp.trim()
        const email = formData.email.trim()

        try {
            // Try 'signup' token first (standard for email confirmation code)
            let { error } = await supabase.auth.verifyOtp({
                email,
                type: 'signup',
                token
            })

            if (error) {
                // Fallback: Try 'email' type (sometimes used for Magic Link / OTP login flows)
                console.log("Signup verify failed, trying 'email' type...", error.message)
                const { error: fallbackError } = await supabase.auth.verifyOtp({
                    email,
                    type: 'email',
                    token
                })

                if (fallbackError) {
                    throw error
                }
            }

            toast({
                title: "Email verified!",
                description: "Your account is ready."
            })

            navigate('/onboarding')

        } catch (error) {
            toast({
                title: "Verification failed",
                description: checkRateLimit(error),
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    if (step === 'verify') {
        return (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Verify email</h1>
                    <p className="text-zinc-400">
                        We sent a code to <span className="text-white font-medium">{formData.email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerifyParams} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="otp" className="text-zinc-300">Enter Code</Label>
                        <Input
                            id="otp"
                            placeholder="Enter verification code"
                            required
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-zinc-700 text-center tracking-widest text-lg"
                            maxLength={8}
                        />
                    </div>

                    <Button type="submit" className="w-full h-12 bg-[#c25e2e] hover:bg-[#a94f24] text-white font-medium rounded-lg shadow-lg shadow-orange-900/20 text-base mt-2" disabled={loading}>
                        {loading ? "Verifying..." : "Confirm & Continue"}
                    </Button>

                    <div className="flex flex-col gap-2 mt-4 text-center">
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendTimer > 0}
                            className={`text-sm ${resendTimer > 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-[#c25e2e] hover:text-[#a94f24] hover:underline'}`}
                        >
                            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('details')}
                            className="text-zinc-500 hover:text-white text-sm transition-colors"
                        >
                            Change email or details
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}`
                }
            })
            if (error) throw error
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        }
    }

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
                <p className="text-zinc-400">Welcome! Please fill in the details to get started.</p>
            </div>

            <div className="space-y-4">
                <Button
                    variant="outline"
                    className="w-full h-12 bg-white text-zinc-900 hover:bg-zinc-100 border-0 font-medium text-base rounded-lg flex items-center justify-center gap-2"
                    onClick={handleGoogleLogin}
                    type="button"
                >
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

                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-zinc-300">First name</Label>
                            <Input
                                id="firstName"
                                placeholder="First name"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-10 rounded-lg focus-visible:ring-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-zinc-300">Last name</Label>
                            <Input
                                id="lastName"
                                placeholder="Last name"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-10 rounded-lg focus-visible:ring-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email address"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-zinc-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-zinc-300">Phone number</Label>
                        <div className="flex">
                            <div className="flex items-center justify-center px-3 border border-r-0 border-zinc-800 bg-zinc-900 text-zinc-400 rounded-l-lg text-sm">
                                IN +91
                            </div>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-l-none rounded-r-lg focus-visible:ring-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-zinc-700"
                        />
                    </div>

                    <Button type="submit" className="w-full h-12 bg-[#c25e2e] hover:bg-[#a94f24] text-white font-medium rounded-lg shadow-lg shadow-orange-900/20 text-base mt-2" disabled={loading}>
                        {loading ? "Creating account..." : "Continue"}
                    </Button>
                </form>

                <div className="text-center text-sm text-zinc-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-zinc-300 hover:text-white font-medium transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}
