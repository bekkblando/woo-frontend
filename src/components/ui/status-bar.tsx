import { cn } from '../../utils/cn';
import type { QuestionProgress } from '../../context/RequestFormContext';

interface StatusBarProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    currentStep?: number; // For large version, specify which step to show (0-based index)
    progress?: QuestionProgress; // Real-time progress from backend (sm/md only)
}

// Pipeline stage keys in order, mapped to display labels and descriptions
const PIPELINE_STAGES: { key: string; label: string; description: string }[] = [
    { key: 'generating_queries', label: 'Zoekopdrachten voorbereiden', description: 'We analyseren uw vraag en bedenken de beste zoektermen' },
    { key: 'searching', label: 'Documenten doorzoeken', description: 'We doorzoeken duizenden overheidsdocumenten' },
    { key: 'evaluating', label: 'Resultaten beoordelen', description: 'We bepalen welke documenten relevant zijn voor uw vraag' },
    { key: 'extracting', label: 'Bewijs verzamelen', description: 'We lezen de relevante pagina\u2019s en zoeken naar specifieke antwoorden' },
    { key: 'synthesizing', label: 'Antwoord opstellen', description: 'We combineren alle gevonden informatie tot een helder antwoord' },
    { key: 'formatting', label: 'Bronnen opmaken', description: 'We maken de bronvermeldingen op zodat u ze kunt verifiëren' },
];

// Additional steps for the status page (large version)
const STATUS_PAGE_STEPS: { label: string; description: string }[] = [
    { label: 'Verzoek ontvangen', description: 'Uw informatieverzoek is bij ons binnengekomen en geregistreerd.' },
    { label: 'Contactpersoon toewijzen', description: 'Een Woo-contactfunctionaris wordt aan uw verzoek gekoppeld.' },
    { label: 'Documenten doorzoeken', description: 'Relevante overheidsdocumenten worden verzameld en beoordeeld.' },
    { label: 'Informatie beoordelen', description: 'De gevonden informatie wordt gecontroleerd op volledigheid en relevantie.' },
    { label: 'Reactie opstellen', description: 'Op basis van de gevonden documenten wordt een antwoord geformuleerd.' },
    { label: 'Reactie verzonden', description: 'Het definitieve antwoord is naar u verstuurd.' },
];

/**
 * Resolve the current step index and display text from a QuestionProgress object.
 * Falls back to step 0 with a generic label when no progress has been received yet.
 */
function resolveProgress(progress?: QuestionProgress): { stepIndex: number; label: string; description: string; detail?: string } {
    if (!progress) {
        return { stepIndex: 0, label: 'Verwerken\u2026', description: 'Even geduld, we gaan zo aan de slag' };
    }
    const idx = PIPELINE_STAGES.findIndex(s => s.key === progress.stage);
    if (idx === -1) {
        return { stepIndex: 0, label: progress.stage, description: '', detail: progress.detail };
    }
    return { stepIndex: idx, label: PIPELINE_STAGES[idx].label, description: PIPELINE_STAGES[idx].description, detail: progress.detail };
}

const StatusBar = ({ size = 'md', className, currentStep: fixedStep, progress }: StatusBarProps) => {
    const { stepIndex, label, description, detail } = resolveProgress(progress);

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

    // Small version: dots + label on one row, description and detail below
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
                    <span className={cn('text-[#154273] font-medium whitespace-nowrap', classes.text)}>
                        {label}
                    </span>
                </div>
                <p className="text-[11px] text-[#154273]/60 leading-tight ml-0.5">
                    {detail || description}
                </p>
            </div>
        );
    }

    // Large version: show all steps with descriptions (static, no animation)
    if (size === 'lg') {
        return (
            <div className={cn('flex flex-col gap-4', className)}>
                {STATUS_PAGE_STEPS.map((step, index) => {
                    const isCompleted = index < statusPageCurrentStep;
                    const isCurrent = index === statusPageCurrentStep;

                    return (
                        <div key={index} className="flex items-start gap-4">
                            <div className="flex flex-col items-center mt-0.5">
                                <div
                                    className={cn(
                                        'rounded-full flex-shrink-0 transition-all duration-300',
                                        isCompleted
                                            ? 'w-4 h-4 bg-[#03689B]'
                                            : isCurrent
                                                ? 'w-4 h-4 bg-[#03689B] ring-4 ring-[#03689B]/20 animate-pulse'
                                                : 'w-3.5 h-3.5 bg-gray-300'
                                    )}
                                />
                                {index < STATUS_PAGE_STEPS.length - 1 && (
                                    <div
                                        className={cn(
                                            'w-0.5 transition-all duration-300',
                                            isCompleted ? 'bg-[#03689B]' : 'bg-gray-200',
                                            'h-10'
                                        )}
                                    />
                                )}
                            </div>
                            <div className="flex-1 pb-2">
                                <div className={cn(
                                    'transition-colors font-semibold',
                                    classes.text,
                                    isCompleted || isCurrent
                                        ? 'text-[#154273]'
                                        : 'text-gray-400'
                                )}>
                                    {step.label}
                                </div>
                                <p className={cn(
                                    'text-sm mt-0.5 transition-colors leading-relaxed',
                                    isCompleted || isCurrent
                                        ? 'text-[#154273]/70'
                                        : 'text-gray-300'
                                )}>
                                    {step.description}
                                </p>
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
            <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-1.5">
                    <span className={cn('text-[#154273] font-medium', classes.text)}>
                        {label}
                    </span>
                    {detail && (
                        <span className="text-xs text-[#154273]/60 truncate max-w-[200px]">
                            — {detail}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-[#154273]/50 leading-tight">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatusBar;
