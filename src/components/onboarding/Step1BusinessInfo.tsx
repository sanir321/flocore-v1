import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface Step1Props {
    defaultValues: {
        name: string;
        industry: string;
        size?: string;
        source?: string;
        timezone: string
    }
    onNext: (data: any) => void
}

export default function Step1BusinessInfo({ defaultValues, onNext }: Step1Props) {
    const [data, setData] = useState({
        ...defaultValues,
        size: defaultValues.size || '',
        source: defaultValues.source || ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext(data)
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Your organization</h1>
                <p className="text-zinc-500 text-lg">Tell us about your company.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-300">Company name <span className="text-red-500">*</span></Label>
                    <Input
                        id="name"
                        required
                        value={data.name}
                        onChange={e => setData({ ...data, name: e.target.value })}
                        className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-zinc-700"
                        placeholder="Acme"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="size" className="text-zinc-300">Company size</Label>
                        <select
                            id="size"
                            required
                            value={data.size}
                            onChange={e => setData({ ...data, size: e.target.value })}
                            className="flex h-12 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                        >
                            <option value="" disabled>Select company size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201+">201+ employees</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="industry" className="text-zinc-300">Industry</Label>
                        <select
                            id="industry"
                            required
                            value={data.industry}
                            onChange={e => setData({ ...data, industry: e.target.value })}
                            className="flex h-12 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                        >
                            <option value="" disabled>Select an industry</option>
                            <option value="technology">Technology</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance</option>
                            <option value="ecommerce">E-commerce</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="source" className="text-zinc-300">Where did you hear about us?</Label>
                    <select
                        id="source"
                        required
                        value={data.source}
                        onChange={e => setData({ ...data, source: e.target.value })}
                        className="flex h-12 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                    >
                        <option value="" disabled>Select a source</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="google">Google Search</option>
                        <option value="friend">Friend/Colleague</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <Button type="submit" className="w-full h-12 bg-[#c25e2e] hover:bg-[#a94f24] text-white font-medium rounded-lg shadow-lg shadow-orange-900/20 text-lg mt-8">
                    Continue
                </Button>
            </form>


        </div>
    )
}
