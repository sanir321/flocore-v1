import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [resendTimer])

    const checkRateLimit = (error: unknown) => {
        const err = error as Error;
        if (err?.message?.includes('rate limit')) {
            return 'Too many requests. Please wait a moment.'
        }
        if (err?.message?.includes('User already registered')) {
            return 'User already registered. Please sign in.'
        }
        return err?.message || 'An error occurred'
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
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full space-y-8"
            >
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Verify email</h1>
                    <p className="text-zinc-400 text-lg">
                        We sent a code to <span className="text-white font-semibold">{formData.email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerifyParams} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="otp" className="text-zinc-400 font-medium ml-1">Enter Code</Label>
                        <Input
                            id="otp"
                            placeholder="00000000"
                            required
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-14 rounded-xl focus-visible:ring-zinc-700 text-center tracking-[0.5em] text-2xl font-bold"
                            maxLength={8}
                            aria-label="One-time password code"
                        />
                    </div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                    >
                        <Button type="submit" className="w-full h-14 bg-[#c25e2e] hover:bg-[#a94f24] text-white font-bold rounded-xl shadow-2xl shadow-orange-900/30 text-lg" disabled={loading}>
                            {loading ? "Verifying..." : "Confirm & Continue"}
                        </Button>
                    </motion.div>

                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-4">
                        <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 18C10.8954 18 10 17.1046 10 16V12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12V16C14 17.1046 13.1046 18 12 18ZM12 8C11.4477 8 11 7.55228 11 7C11 6.44772 11.4477 6 12 6C12.5523 6 13 6.44772 13 7C13 7.55228 12.5523 8 12 8Z" />
                        </svg>
                        SSL Encryption Active
                    </div>

                    <div className="flex flex-col gap-4 mt-6 text-center">
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendTimer > 0}
                            className={`text-sm font-semibold transition-colors ${resendTimer > 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-[#c25e2e] hover:text-white underline underline-offset-4'}`}
                        >
                            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('details')}
                            className="text-zinc-500 hover:text-white text-sm font-medium transition-colors"
                        >
                            Change email or details
                        </button>
                    </div>
                </form>
            </motion.div>
        )
    }

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}`,
                    queryParams: {
                        prompt: 'select_account consent'
                    }
                }
            })
            if (error) throw error
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive"
            })
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full space-y-8"
        >
            <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white tracking-tight">Create your account</h1>
                <p className="text-zinc-400 text-lg">Join Flowcore and start automating.</p>
            </div>

            <div className="space-y-6">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <Button
                        variant="outline"
                        className="w-full h-14 bg-white text-zinc-900 hover:bg-zinc-100 border-0 font-semibold text-base rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-white/5"
                        onClick={handleGoogleLogin}
                        type="button"
                    >
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </Button>
                </motion.div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0A0A0A] px-4 text-zinc-500 font-semibold tracking-widest">or email sign up</span>
                    </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-zinc-400 font-medium ml-1">First name</Label>
                            <Input
                                id="firstName"
                                placeholder="Jane"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-xl focus-visible:ring-zinc-700 transition-all text-base px-5"
                                aria-label="First name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-zinc-400 font-medium ml-1">Last name</Label>
                            <Input
                                id="lastName"
                                placeholder="Doe"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-xl focus-visible:ring-zinc-700 transition-all text-base px-5"
                                aria-label="Last name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-400 font-medium ml-1">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-xl focus-visible:ring-zinc-700 transition-all text-base px-5"
                            aria-label="Email address"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-zinc-400 font-medium ml-1">Phone number</Label>
                        <div className="flex">
                            <div className="flex items-center justify-center px-4 border border-r-0 border-zinc-800 bg-zinc-900 text-zinc-400 rounded-l-xl text-sm font-medium">
                                +91
                            </div>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="98765 43210"
                                value={formData.phone}
                                onChange={handleChange}
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-l-none rounded-r-xl focus-visible:ring-zinc-700 transition-all text-base px-5"
                                aria-label="Phone number"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-400 font-medium ml-1">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-xl focus-visible:ring-zinc-700 transition-all text-base px-5"
                            aria-label="Password"
                        />
                    </div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        className="pt-4"
                    >
                        <Button type="submit" className="w-full h-14 bg-[#c25e2e] hover:bg-[#a94f24] text-white font-bold rounded-xl shadow-2xl shadow-orange-900/30 text-lg" disabled={loading}>
                            {loading ? "Creating account..." : "Get Started"}
                        </Button>
                    </motion.div>

                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 18C10.8954 18 10 17.1046 10 16V12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12V16C14 17.1046 13.1046 18 12 18ZM12 8C11.4477 8 11 7.55228 11 7C11 6.44772 11.4477 6 12 6C12.5523 6 13 6.44772 13 7C13 7.55228 12.5523 8 12 8Z" />
                        </svg>
                        Secure registration via SSL
                    </div>
                </form>

                <div className="text-center text-sm text-zinc-500 mt-8">
                    Already have an account?{' '}
                    <Link to="/login" className="text-white hover:text-orange-400 font-semibold transition-colors decoration-zinc-700 underline underline-offset-4 decoration-2">
                        Sign In
                    </Link>
                </div>
            </div>
        </motion.div>
    )
}
