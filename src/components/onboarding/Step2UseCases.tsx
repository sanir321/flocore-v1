import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

interface Step2Props {
    defaultValues: { support_enabled: boolean; appointments_enabled: boolean }
    onNext: (data: any) => void
    onBack: () => void
}

export default function Step2UseCases({ defaultValues, onNext, onBack }: Step2Props) {
    const [data, setData] = useState(defaultValues)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Select Use Cases</CardTitle>
                <CardDescription>What do you want your AI agents to do?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start space-x-3 space-y-0 text-left">
                    <Checkbox
                        id="support"
                        checked={data.support_enabled}
                        onCheckedChange={(checked: boolean | "indeterminate") => setData((prev: any) => ({ ...prev, support_enabled: checked === true }))}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="support" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Customer Support
                        </Label>
                        <p className="text-sm text-muted-foreground mt-2">
                            Answer FAQs, handle queries, and escalate complex issues to humans.
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-3 space-y-0 text-left">
                    <Checkbox
                        id="appointments"
                        checked={data.appointments_enabled}
                        onCheckedChange={(checked: boolean | "indeterminate") => setData((prev: any) => ({ ...prev, appointments_enabled: checked === true }))}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="appointments" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Appointment Booking
                        </Label>
                        <p className="text-sm text-muted-foreground mt-2">
                            Connect with Google Calendar to check availability and book slots.
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={() => onNext(data)}>Next</Button>
            </CardFooter>
        </Card>
    )
}
