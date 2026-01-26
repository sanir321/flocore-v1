import { useState } from 'react'
import Step1BusinessInfo from './Step1BusinessInfo'
import Step3AgentSetup from './Step3AgentSetup'

export default function OnboardingWizard() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        size: '',
        source: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        support_enabled: false,
        appointments_enabled: false
    })

    const handleNext = (data: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...data }))
        setStep(prev => prev + 1)
    }



    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {/* 
                    Progress is now handled visually within steps via dots to match specific "Conduit" design 
                    instead of a top bar.
                 */}

                {step === 1 && (
                    <Step1BusinessInfo
                        defaultValues={formData}
                        onNext={handleNext}
                    />
                )}

                {step === 2 && (
                    <Step3AgentSetup
                        data={formData}
                    />
                )}
            </div>
        </div>
    )
}
