import { useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconLoader2, IconChevronDown } from '@tabler/icons-react';
import { RequestFormContext } from '../context/RequestFormContext';
import type { Answer } from '../context/RequestFormContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";


const AnswerViewer = ({ answer }: { answer: Answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 w-full">
                <div className="text-sm text-[#154273] truncate flex-1">{answer.answer}</div>
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
                <div className="mt-2 p-3 bg-white border border-[#F68153] rounded text-sm text-[#154273]">
                    {answer.answer}
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
    if (!requestForm) return null;
    
    const handleSubmit = async () => {
        if (finalize) {
            setSubmitting(true);
            try {
                const response = await fetch(`${BACKEND_URL}/api/finalize/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wooRequestId: searchParams.get("wooRequestId") })
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to finalize request' }));
                    throw new Error(errorData.error || 'Failed to finalize request');
                }
                navigate(`/finalize?chatId=${searchParams.get("chatId")}&wooRequestId=${searchParams.get("wooRequestId")}`);
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
        <div>
            <div className="h-[50vh] p-6 md:p-8 bg-[#F5F5F5] border-2 border-[#738DA7] mb-6">
                    <div>
                   
                    <div className="text-sm py-2">
                    <p className="text-sm py-2">Onderwerp: Informatie verzoek </p>

                    <p className="text-sm py-2">Geachte Heer/Mevrouw, </p>

                    <p className="text-sm py-2">Via deze mail doe ik het verzoek op grond van de Wet Open Overheid. Ik verzoek openbaring van de volgende informatie:</p>
                    </div>
                    {requestForm.questions.map((question) => (
                        <div key={question.question}>
                            <label className="block text-sm font-medium text-[#154273]">{question.question}</label>
                            {question.answer_loading ? (
                                <div className="flex items-center gap-2 text-sm text-[#154273]">
                                    <IconLoader2 className="animate-spin h-4 w-4" />
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
               <div className="text-sm w-full flex justify-between items-center">Ben je tevreden met deze informatie? Stuur jouw verzoek naar je mailadres. 
                   <button onClick={handleSubmit} disabled={submitting} className="text-sm display-inline-block bg-[#F68153] text-white px-2 py-1">
                     Ontvang informatie
                   </button>
               </div>
   
   
               <div className="mt-6 w-full flex justify-between items-center">Wil je meer weten? Dan helpen we je graag verder.
                   <button onClick={handleSubmit} disabled={submitting} className="text-sm display-inline-block bg-[#03689B] text-white px-2 py-1">
                       Ga verder
                   </button>
               </div>
               </>
            ) : (
                <>
            <div className="text-sm w-full flex justify-between items-center">Ben je tevreden met deze informatie? Stuur jouw verzoek naar je mailadres. 
                <button onClick={handleSubmit} disabled={submitting} className="text-sm display-inline-block bg-[#F68153] text-white px-2 py-1">
                  Ontvang informatie
                </button>
            </div>


            <div className="mt-6 w-full flex justify-between items-center">Wil je meer weten? Dan helpen we je graag verder.
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