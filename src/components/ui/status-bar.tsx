import { cn } from '../../utils/cn';
import type { QuestionProgress } from '../../context/RequestFormContext';

interface StatusBarProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    currentStep?: number; // For large version, specify which step to show (0-based index)
    progress?: QuestionProgress; // Real-time progress from backend (sm/md only)
}

// Pipeline stage keys in order, mapped to display labels
const PIPELINE_STAGES: { key: string; label: string }[] = [
    { key: 'generating_queries', label: 'Zoekquery\u2019s genereren' },
    { key: 'searching', label: 'Zoeken naar informatie' },
    { key: 'evaluating', label: 'Resultaten evalueren' },
    { key: 'filtering', label: 'Relevante pagina\u2019s selecteren' },
    { key: 'extracting', label: 'Citaten extraheren' },
    { key: 'synthesizing', label: 'Antwoord formuleren' },
    { key: 'formatting', label: 'Citaten opmaken' },
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

/**
 * Resolve the current step index and display text from a QuestionProgress object.
 * Falls back to step 0 with a generic label when no progress has been received yet.
 */
function resolveProgress(progress?: QuestionProgress): { stepIndex: number; label: string; detail?: string } {
    if (!progress) {
        return { stepIndex: 0, label: 'Verwerken\u2026' };
    }
    const idx = PIPELINE_STAGES.findIndex(s => s.key === progress.stage);
    if (idx === -1) {
        return { stepIndex: 0, label: progress.stage, detail: progress.detail };
    }
    return { stepIndex: idx, label: PIPELINE_STAGES[idx].label, detail: progress.detail };
}

const StatusBar = ({ size = 'md', className, currentStep: fixedStep, progress }: StatusBarProps) => {
    const { stepIndex, label, detail } = resolveProgress(progress);

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

    // For large version, use fixed step if provided, otherwise show all completed
    const statusPageCurrentStep = fixedStep !== undefined ? fixedStep : STATUS_PAGE_STEPS.length - 1;

    // Total dots = pipeline stages + 1 trailing dot (never reached)
    const totalDots = PIPELINE_STAGES.length + 1;

    // Small version: dots + label on one row, detail text below
    if (size === 'sm') {
        return (
            <div className={cn('flex flex-col gap-1', className)}>
                <div className="flex items-center gap-2">
                    <div className={cn('flex items-center', classes.gap)}>
                        {Array.from({ length: totalDots }).map((_, index) => (
                            <div key={index} className="flex items-center gap-1">
                                <div
                                    className={cn(
                                        'rounded-full transition-all duration-300',
                                        classes.dot,
                                        index < stepIndex
                                            ? 'bg-[#03689B]'
                                            : index === stepIndex
                                                ? 'bg-[#03689B] animate-pulse'
                                                : 'bg-gray-300'
                                    )}
                                />
                                {index < totalDots - 1 && (
                                    <div
                                        className={cn(
                                            'h-0.5 transition-all duration-300',
                                            index < stepIndex ? 'bg-[#03689B]' : 'bg-gray-300',
                                            'w-2'
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <span className={cn('text-[#154273] whitespace-nowrap', classes.text)}>
                        {label}
                    </span>
                </div>
                {detail && (
                    <p className="text-[11px] text-[#154273]/50 leading-tight ml-0.5">
                        {detail}
                    </p>
                )}
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
                                index < stepIndex
                                    ? 'bg-[#03689B]'
                                    : index === stepIndex
                                        ? 'bg-[#03689B] animate-pulse'
                                        : 'bg-gray-300'
                            )}
                        />
                        {index < totalDots - 1 && (
                            <div
                                className={cn(
                                    'h-0.5 transition-all duration-300',
                                    index < stepIndex ? 'bg-[#03689B]' : 'bg-gray-300',
                                    size === 'md' ? 'w-4' : 'w-8'
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={cn('text-[#154273]', classes.text)}>
                    {label}
                </span>
                {detail && (
                    <span className="text-xs text-[#154273]/60 truncate max-w-[200px]">
                        {detail}
                    </span>
                )}
            </div>
        </div>
    );
};

export default StatusBar;
