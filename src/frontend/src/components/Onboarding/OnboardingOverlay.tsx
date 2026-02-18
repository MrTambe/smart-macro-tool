import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { X, ChevronRight, Download, Check, Terminal, FolderOpen, MessageSquare, Zap } from 'lucide-react'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Smart Macro Tool!',
    description: 'Your AI-powered spreadsheet assistant',
    icon: <Zap className="w-12 h-12 text-yellow-500" />
  },
  {
    id: 2,
    title: 'Open Your Files',
    description: 'Click the folder icon to open Excel, CSV, or JSON files',
    icon: <FolderOpen className="w-12 h-12 text-blue-500" />
  },
  {
    id: 3,
    title: 'Chat with AI',
    description: 'Ask questions about your data in plain English',
    icon: <MessageSquare className="w-12 h-12 text-green-500" />
  },
  {
    id: 4,
    title: 'Ready to Use!',
    description: 'All systems are configured. Let\'s go!',
    icon: <Check className="w-12 h-12 text-green-500" />
  }
]

export const OnboardingOverlay: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const { updateSetting } = useSettingsStore()

  useEffect(() => {
    // Check if onboarding was completed
    const completed = localStorage.getItem('onboarding_completed')
    if (!completed) {
      setIsVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('onboarding_completed', 'true')
    updateSetting('showWelcomeScreen', false)
  }

  const handleSkip = () => {
    handleClose()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Getting Started</h2>
            <button 
              onClick={handleSkip}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-100 rounded-full">
              {steps[currentStep].icon}
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {steps[currentStep].title}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {steps[currentStep].description}
          </p>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-blue-600' 
                    : index < currentStep 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium flex items-center justify-center gap-2"
          >
            {currentStep === steps.length - 1 ? 'Get Started!' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingOverlay
