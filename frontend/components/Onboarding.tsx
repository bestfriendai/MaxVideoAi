'use client';

import React, { useState, useEffect, useCallback, memo, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Image,
  Sparkles,
  Zap,
  ArrowRight,
  Check,
  X,
  Play,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';

// Onboarding step configuration
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image?: string;
  features?: string[];
}

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MaxVideoAI',
    description: 'Create stunning AI-generated videos and images in minutes. Let\'s show you around.',
    icon: Sparkles,
    features: [
      'Generate videos from text prompts',
      'Transform images into videos',
      'Access multiple AI engines',
    ],
  },
  {
    id: 'video',
    title: 'Generate Videos',
    description: 'Turn your ideas into reality with our text-to-video and image-to-video generation.',
    icon: Video,
    features: [
      'Multiple AI engines to choose from',
      'Custom aspect ratios and durations',
      'High-quality output up to 4K',
    ],
  },
  {
    id: 'image',
    title: 'Create Images',
    description: 'Generate beautiful images with powerful AI models designed for creativity.',
    icon: Image,
    features: [
      'Text-to-image generation',
      'Style transfer and editing',
      'Batch generation support',
    ],
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'Start creating amazing content with MaxVideoAI. We can\'t wait to see what you make.',
    icon: Zap,
    features: [
      'Press ⌘K to quickly navigate',
      'Save favorites to your library',
      'Track all jobs in the Jobs page',
    ],
  },
];

// Onboarding context
interface OnboardingContextType {
  isComplete: boolean;
  currentStep: number;
  totalSteps: number;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

const ONBOARDING_KEY = 'maxvideoai.onboarding.complete';

interface OnboardingProviderProps {
  children: React.ReactNode;
  steps?: OnboardingStep[];
  forceShow?: boolean;
}

export function OnboardingProvider({
  children,
  steps = defaultSteps,
  forceShow = false,
}: OnboardingProviderProps) {
  const [isComplete, setIsComplete] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed || forceShow) {
      setIsComplete(false);
      setShowModal(true);
    }
  }, [forceShow]);

  const startOnboarding = useCallback(() => {
    setCurrentStep(0);
    setShowModal(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsComplete(true);
    setShowModal(false);
  }, []);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, steps.length - 1)));
  }, [steps.length]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, steps.length, completeOnboarding]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isComplete,
        currentStep,
        totalSteps: steps.length,
        startOnboarding,
        completeOnboarding,
        goToStep,
        nextStep,
        prevStep,
        skipOnboarding,
      }}
    >
      {children}
      <OnboardingModal
        isOpen={showModal && !isComplete}
        onClose={skipOnboarding}
        steps={steps}
        currentStep={currentStep}
        onNext={nextStep}
        onPrev={prevStep}
        onComplete={completeOnboarding}
        onGoToStep={goToStep}
      />
    </OnboardingContext.Provider>
  );
}

// Onboarding Modal
interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: OnboardingStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  onGoToStep: (step: number) => void;
}

const OnboardingModal = memo(function OnboardingModal({
  isOpen,
  onClose,
  steps,
  currentStep,
  onNext,
  onPrev,
  onComplete,
  onGoToStep,
}: OnboardingModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const Icon = step.icon;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-gray-900 shadow-2xl"
            >
              {/* Skip Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                aria-label="Skip onboarding"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Icon */}
                    <div className="flex justify-center">
                      <div className="rounded-2xl bg-purple-600/20 p-4">
                        <Icon className="h-12 w-12 text-purple-400" />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                      <p className="text-gray-400">{step.description}</p>
                    </div>

                    {/* Features List */}
                    {step.features && (
                      <ul className="space-y-3">
                        {step.features.map((feature, index) => (
                          <motion.li
                            key={feature}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 text-gray-300"
                          >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600/20">
                              <Check className="h-3.5 w-3.5 text-purple-400" />
                            </div>
                            <span>{feature}</span>
                          </motion.li>
                        ))}
                      </ul>
                    )}

                    {/* Image */}
                    {step.image && (
                      <div className="overflow-hidden rounded-lg border border-gray-800">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="w-full"
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-800 bg-gray-900/50 px-8 py-4">
                <div className="flex items-center justify-between">
                  {/* Step Indicators */}
                  <div className="flex items-center gap-2">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => onGoToStep(index)}
                        className={cn(
                          'h-2 w-2 rounded-full transition-all',
                          index === currentStep
                            ? 'w-6 bg-purple-500'
                            : index < currentStep
                            ? 'bg-purple-600/50'
                            : 'bg-gray-700'
                        )}
                        aria-label={`Go to step ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-3">
                    {currentStep > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPrev}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={isLastStep ? onComplete : onNext}
                      className="gap-2"
                    >
                      {isLastStep ? (
                        <>
                          Get Started
                          <Play className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
});

// Feature Tour - In-page guided tour
interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface FeatureTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const FeatureTour = memo(function FeatureTour({
  steps,
  isActive,
  onComplete,
  onSkip,
}: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];
    const target = document.querySelector(step.target);

    if (target) {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll target into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive, currentStep, steps]);

  if (!mounted || !isActive || !targetRect) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Calculate tooltip position
  const position = step.position || 'bottom';
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
  };

  switch (position) {
    case 'top':
      tooltipStyle.bottom = window.innerHeight - targetRect.top + 12;
      tooltipStyle.left = targetRect.left + targetRect.width / 2;
      tooltipStyle.transform = 'translateX(-50%)';
      break;
    case 'bottom':
      tooltipStyle.top = targetRect.bottom + 12;
      tooltipStyle.left = targetRect.left + targetRect.width / 2;
      tooltipStyle.transform = 'translateX(-50%)';
      break;
    case 'left':
      tooltipStyle.right = window.innerWidth - targetRect.left + 12;
      tooltipStyle.top = targetRect.top + targetRect.height / 2;
      tooltipStyle.transform = 'translateY(-50%)';
      break;
    case 'right':
      tooltipStyle.left = targetRect.right + 12;
      tooltipStyle.top = targetRect.top + targetRect.height / 2;
      tooltipStyle.transform = 'translateY(-50%)';
      break;
  }

  return createPortal(
    <>
      {/* Overlay with cutout */}
      <div className="fixed inset-0 z-[9998]">
        <svg className="h-full w-full">
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.5)"
            mask="url(#tour-mask)"
          />
        </svg>
      </div>

      {/* Highlight border */}
      <div
        className="fixed z-[9999] rounded-lg border-2 border-purple-500 pointer-events-none"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
        }}
      />

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="w-72 rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-xl"
      >
        <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
        <p className="mb-4 text-sm text-gray-400">{step.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="xs" onClick={onSkip}>
              Skip
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={() => {
                if (isLastStep) {
                  onComplete();
                } else {
                  setCurrentStep((prev) => prev + 1);
                }
              }}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
});
