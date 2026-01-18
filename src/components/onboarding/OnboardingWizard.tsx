import { useState } from 'react'
import Step1BusinessInfo from './Step1BusinessInfo'
import Step2UseCases from './Step2UseCases'
import Step3AgentSetup from './Step3AgentSetup'
import { Progress } from '@/components/ui/progress'

export default function OnboardingWizard() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        support_enabled: false,
        appointments_enabled: false
    })

    // Calculate progress
    const progress = (step / 3) * 100

    const handleNext = (data: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...data }))
        setStep(prev => prev + 1)
    }

    const handleBack = () => {
        setStep(prev => prev - 1)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-center">Setup Your Workspace</h1>
                    <Progress value={progress} className="h-2" />
                </div>

                {step === 1 && (
                    <Step1BusinessInfo
                        defaultValues={formData}
                        onNext={handleNext}
                    />
                )}

                {step === 2 && (
                    <Step2UseCases
                        defaultValues={formData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {step === 3 && (
                    <Step3AgentSetup
                        data={formData}
                        onBack={handleBack}
                    />
                )}
            </div>
        </div>
    )
}
