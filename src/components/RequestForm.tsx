import { useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconChevronDown } from '@tabler/icons-react';
import { RequestFormContext } from '../context/RequestFormContext';
import type { Answer } from '../context/RequestFormContext';
import StatusBar from './ui/status-bar';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";


const AnswerViewer = ({ answer }: { answer: Answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Find chunk URL by chunk_id
    const getChunkUrl = (chunkId: string): string | undefined => {
        const chunk = answer.chunks?.find(chunk => chunk.id === chunkId);
        return chunk?.content?.content?.url;
    };

    // Get dot color based on answered status
    const getDotColor = () => {
        switch (answer.answered) {
            case "yes":
                return "bg-green-500";
            case "partial":
                return "bg-yellow-500";
            case "no":
                return "bg-red-500";
            default:
                return "bg-gray-400";
        }
    };

    // Show Dutch text if not answered
    const displayText = answer.answered === "no" 
        ? "Niet beantwoord" 
        : answer.answer;

    return (
        <div className="w-full relative">
            <div className="flex items-center gap-2 w-full">
                <div className={`flex-shrink-0 w-3 h-3 rounded-full ${getDotColor()}`}></div>
                <div className="text-sm text-[#154273] truncate flex-1">{displayText}</div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-shrink-0 w-6 h-6 rounded-full border border-[#F68153] flex items-center justify-center hover:bg-[#F68153]/10 transition-colors"
                    aria-label="Toggle answer details"
                >
                    <IconChevronDown 
                        className={`h-3 w-3 text-[#F68153] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>
            {isOpen && (
                <div className="relative z-[9999] mt-2 p-3 bg-white border border-[#F68153] rounded text-sm text-[#154273] shadow-lg">
                    <div className="mb-3">{answer.answered === "no" ? "Niet beantwoord" : answer.answer}</div>
                    {answer.details?.blocks && answer.details.blocks.length > 0 && (
                        <div className="mt-4 space-y-3">
                            {answer.details.blocks.map((block, index) => {
                                const url = getChunkUrl(block.chunk_id);
                                return (
                                    <div key={index} className="border-l-2 border-[#F68153] pl-3 py-2">
                                        <div className="italic text-gray-700 mb-2">
                                            "{block.quote}"
                                        </div>
                                        {url && (
                                            <a 
                                                href={url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[#03689B] hover:underline text-xs"
                                            >
                                                Bekijk bron →
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const RequestForm = ({ finalize = false }: { finalize?: boolean }) => {
    const requestForm = useContext(RequestFormContext);
    const [submitting, setSubmitting] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState<string>("");
    const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);

    if (!requestForm) return null;
    
    const handleSubmit = async () => {
        if (finalize) {
            setSubmitting(true);
            try {
                const response = await fetch(`${BACKEND_URL}/api/finalize/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wooRequestId: searchParams.get("wooRequestId"), email: userEmail })
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to finalize request' }));
                    throw new Error(errorData.error || 'Failed to finalize request');
                }
                navigate(`/completed-request?wooRequestId=${searchParams.get("wooRequestId")}`);
            } catch (error) {
                console.error('Error finalizing request:', error);
                alert(error instanceof Error ? error.message : 'Failed to finalize request');
            } finally {
                setSubmitting(false);
            }
        } else {
            navigate(`/finalize?chatId=${searchParams.get("chatId")}&wooRequestId=${searchParams.get("wooRequestId")}`);
        }
    };

  

    console.log("Request form questions", requestForm.questions);
    return (
        <div className={`${finalize ? 'flex flex-col md:flex-row gap-6' : 'flex flex-col'}`}>
            <div className={`${finalize ? 'w-full md:w-1/2' : 'max-h-[70vh]'} flex flex-col`}>
                <div className={`p-6 md:p-8 flex-1 overflow-y-auto bg-[#F5F5F5] border-2 border-[#738DA7] mb-6`}>
                    <div className="text-sm py-2">
                        <p className="text-sm py-2">Onderwerp: Informatie verzoek </p>

                        <p className="text-sm py-2">Geachte Heer/Mevrouw, </p>

                        <p className="text-sm py-2">Via deze mail doe ik het verzoek op grond van de Wet Open Overheid. Ik verzoek openbaring van de volgende informatie:</p>
                    </div>
                    {requestForm.questions.map((question) => (
                        <div key={question.question} className="mb-4">
                            <label className="block text-sm font-medium text-[#154273] mb-2">{question.question}</label>
                            {question.answer_loading ? (
                                <div className="py-2">
                                    <StatusBar size="sm" />
                                </div>
                            ) : question.answer ? (
                                <AnswerViewer answer={question.answer} />
                            ) : null}
                        </div>
                    ))}
                    <div className="text-sm py-2">
                        <p>Met vriendelijke groet,</p>
                        <p>Jan van Hamelen</p>
                    </div>
                </div>
            </div>
            { finalize ? (
                <>
                {/* {!emailSubmitted ? <div>
                    <p>Voer je mailadres in</p>
                    <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="text-sm display-inline-block rounded-sm bg-[#EFF7FC] border-2 border-[#03689B] h-8 px-2" />
                    <button onClick={() => setEmailSubmitted(true)} className="text-sm ml-2 display-inline-block bg-[#F68153] text-white px-2 py-1">
                        Submit
                    </button>
                </div> : ( */}
                <div className="w-full md:w-1/2 flex flex-col gap-6 px-6">
                <div className="text-sm w-full flex flex-col gap-2 justify-between text-left items-center">
                    <div className="text-2xl font-bold self-start">Informatie verzoek</div>
                    <div>Kies deze optie als je aanvullende informatie zoekt omdat je vraag nog niet volledig beantwoord kon worden met de openbaar beschikbare gegevens. Deze route biedt ruimte om, wanneer dat passend is, extra of meer contextuele informatie te verstrekken.</div>
                    <button onClick={() => {}} disabled={submitting} className="text-2xl display-inline-block bg-[#F68153] self-end text-white px-4 py-2">
                    Stuur een informatieverzoek
                    </button>
                </div>
    
    
                <div className="mt-6 w-full flex flex-col gap-2 justify-between text-left items-center">
                        <div className="text-2xl font-bold self-start">WOO verzoek</div>
                        <div>Kies deze optie als je een formele informatieaanvraag wilt indienen waarop de overheid binnen vier tot zes weken moet reageren. Je verzoek wordt behandeld volgens de Wet open overheid (Woo), en waar mogelijk ontvang je relevante documenten en toelichtingen om je vraag volledig te beantwoorden.</div>
                    <button onClick={handleSubmit} disabled={submitting} className="text-2xl display-inline-block bg-[#03689B] self-end text-white px-4 py-2">
                    Stuur een informatieverzoek
                    </button>
                </div>
                </div>
                {/* )} */}
               </>
            ) : (
                <>
            <div className="text-sm w-full flex justify-between items-center pt-6">Ben je tevreden met deze informatie? Stuur jouw verzoek naar je mailadres. 
                <button onClick={handleSubmit} disabled={submitting} className="text-sm display-inline-block bg-[#F68153] text-white px-2 py-1">
                  Ontvang informatie
                </button>
            </div>


            <div className="pt-6 w-full flex justify-between items-center">Wil je meer weten? Dan helpen we je graag verder.
                <button onClick={handleSubmit} disabled={submitting} className="text-sm display-inline-block bg-[#03689B] text-white px-2 py-1">
                    Ga verder
                </button>
            </div>
            </>
            )}
        </div>
    );
};

export default RequestForm;