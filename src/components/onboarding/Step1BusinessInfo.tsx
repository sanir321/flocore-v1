import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

interface Step1Props {
    defaultValues: { name: string; industry: string; timezone: string }
    onNext: (data: any) => void
}

export default function Step1BusinessInfo({ defaultValues, onNext }: Step1Props) {
    const [data, setData] = useState(defaultValues)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext(data)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Tell us about your business.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Business Name</Label>
                        <Input
                            id="name"
                            required
                            value={data.name}
                            onChange={e => setData({ ...data, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                            id="industry"
                            placeholder="e.g. Healthcare, Retail"
                            required
                            value={data.industry}
                            onChange={e => setData({ ...data, industry: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                            id="timezone"
                            required
                            value={data.timezone}
                            onChange={e => setData({ ...data, timezone: e.target.value })}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full">Next</Button>
                </CardFooter>
            </form>
        </Card>
    )
}
