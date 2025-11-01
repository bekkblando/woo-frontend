import { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface StatusBarProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    currentStep?: number; // For large version, specify which step to show (0-based index)
}

const STATUS_STEPS = [
    'Zoeken naar relevante informatie',
    'Extracteren van relevante informatie',
    'Formuleren van reactie'
];

// Additional steps for the status page (large version)
const STATUS_PAGE_STEPS = [
    'Verzoek ontvangen',
    'Contactpersoon toewijzen',
    'Zoeken naar relevante informatie',
    'Extracteren van relevante informatie',
    'Formuleren van reactie',
    'Reactie verzonden'
];

const StatusBar = ({ size = 'md', className, currentStep: fixedStep }: StatusBarProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Make the first step (search) longer on average: 3-5 seconds
    // Other steps: 2-3 seconds
    const stepTimingsRef = useRef<number[]>(
        STATUS_STEPS.map((_, index) => {
            if (index === 0) {
                // First step (search) - longer: 3000-5000ms
                return Math.random() * 2000 + 3000;
            }
            // Other steps - normal: 2000-3000ms
            return Math.random() * 1000 + 2000;
        })
    );

    // Large version is static - no animation
    const isStatic = size === 'lg';
    
    // For large version, use fixed step if provided, otherwise show all completed
    const statusPageCurrentStep = fixedStep !== undefined ? fixedStep : STATUS_PAGE_STEPS.length - 1;

    useEffect(() => {
        // Don't animate if static (large version)
        if (isStatic) {
            return;
        }

        const advanceStep = () => {
            setCurrentStep((prev) => {
                const nextStep = prev + 1;
                // Stop at the last step (never reach the 4th dot)
                if (nextStep >= STATUS_STEPS.length) {
                    return prev; // Stay at last step
                }
                // Schedule next step
                timeoutRef.current = setTimeout(advanceStep, stepTimingsRef.current[nextStep]);
                return nextStep;
            });
        };

        // Start the first step
        const firstStepTiming = stepTimingsRef.current[0];
        timeoutRef.current = setTimeout(advanceStep, firstStepTiming);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isStatic]);

    const sizeClasses = {
        sm: {
            text: 'text-xs',
            dot: 'w-1.5 h-1.5',
            gap: 'gap-1.5',
            container: 'gap-1'
            },
        md: {
            text: 'text-sm',
            dot: 'w-2 h-2',
            gap: 'gap-2',
            container: 'gap-2'
        },
        lg: {
            text: 'text-base',
            dot: 'w-3 h-3',
            gap: 'gap-3',
            container: 'gap-3'
        }
    };

    const classes = sizeClasses[size];
    
    // Total dots: 3 steps + 1 never-reached dot = 4
    const totalDots = STATUS_STEPS.length + 1;
    
    // Don't animate pulse if static
    const shouldAnimate = !isStatic;

    // Small version: horizontal layout with text inline
    if (size === 'sm') {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <div className={cn('flex items-center', classes.gap)}>
                    {Array.from({ length: totalDots }).map((_, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div 
                                className={cn(
                                    'rounded-full transition-all duration-300',
                                    classes.dot,
                                    index < currentStep 
                                        ? 'bg-[#03689B]' 
                                        : index === currentStep 
                                            ? shouldAnimate ? 'bg-[#03689B] animate-pulse' : 'bg-[#03689B]'
                                            : 'bg-gray-300'
                                )}
                            />
                            {index < totalDots - 1 && (
                                <div 
                                    className={cn(
                                        'h-0.5 transition-all duration-300',
                                        index < currentStep ? 'bg-[#03689B]' : 'bg-gray-300',
                                        'w-4'
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <span className={cn('text-[#154273] whitespace-nowrap', classes.text)}>
                    {STATUS_STEPS[currentStep]}
                </span>
            </div>
        );
    }

    // Large version: show all steps with descriptions (static, no animation)
    if (size === 'lg') {
        return (
            <div className={cn('flex flex-col gap-6', className)}>
                {STATUS_PAGE_STEPS.map((step, index) => {
                    const isCompleted = index < statusPageCurrentStep;
                    const isCurrent = index === statusPageCurrentStep;
                    
                    return (
                        <div key={index} className="flex items-start gap-4">
                            <div className="flex flex-col items-center gap-2 mt-1">
                                <div 
                                    className={cn(
                                        'rounded-full flex-shrink-0 transition-all duration-300',
                                        classes.dot,
                                        isCompleted || isCurrent
                                            ? 'bg-[#03689B]'
                                            : 'bg-gray-300'
                                    )}
                                />
                                {index < STATUS_PAGE_STEPS.length - 1 && (
                                    <div 
                                        className={cn(
                                            'w-0.5 transition-all duration-300',
                                            isCompleted ? 'bg-[#03689B]' : 'bg-gray-300',
                                            'h-8'
                                        )}
                                    />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className={cn(
                                    'transition-colors',
                                    classes.text,
                                    isCompleted || isCurrent
                                        ? 'text-[#154273] font-medium'
                                        : 'text-gray-400'
                                )}>
                                    {step}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Medium version: vertical layout with current step text
    return (
        <div className={cn('flex flex-col', classes.container, className)}>
            <div className={cn('flex items-center', classes.gap)}>
                {Array.from({ length: totalDots }).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div 
                            className={cn(
                                'rounded-full transition-all duration-300',
                                classes.dot,
                                index < currentStep 
                                    ? 'bg-[#03689B]' 
                                    : index === currentStep 
                                        ? shouldAnimate ? 'bg-[#03689B] animate-pulse' : 'bg-[#03689B]'
                                        : 'bg-gray-300'
                            )}
                        />
                        {index < totalDots - 1 && (
                            <div 
                                className={cn(
                                    'h-0.5 transition-all duration-300',
                                    index < currentStep ? 'bg-[#03689B]' : 'bg-gray-300',
                                    size === 'md' ? 'w-6' : 'w-8'
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className={cn('text-[#154273]', classes.text)}>
                {STATUS_STEPS[currentStep]}
            </div>
        </div>
    );
};

export default StatusBar;

