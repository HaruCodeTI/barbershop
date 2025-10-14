"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react"

interface OnboardingStep {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    href: string
  }
}

interface OnboardingTourProps {
  steps: OnboardingStep[]
  onComplete?: () => void
  storageKey?: string
}

export function OnboardingTour({ steps, onComplete, storageKey = "onboarding-completed" }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(storageKey)
    if (!completed) {
      // Small delay to let the page load first
      setTimeout(() => setIsOpen(true), 1000)
    }
  }, [storageKey])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true")
    setIsOpen(false)
    onComplete?.()
  }

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true")
    setIsOpen(false)
  }

  if (!isOpen) return null

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-2">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleSkip}
            aria-label="Fechar tour"
          >
            <X className="h-4 w-4" />
          </Button>

          {step.icon && <div className="mb-4">{step.icon}</div>}

          <CardTitle className="text-2xl">{step.title}</CardTitle>
          <CardDescription className="text-base">{step.description}</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress indicator */}
          <div className="flex gap-2 justify-center mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step counter */}
          <p className="text-center text-sm text-muted-foreground">
            Passo {currentStep + 1} de {steps.length}
          </p>
        </CardContent>

        <CardFooter className="flex justify-between gap-2">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <Button onClick={handleNext}>
            {isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Concluir
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
