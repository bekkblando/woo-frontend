import { useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RequestFormContext } from '../context/RequestFormContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const RequestForm = () => {
    const requestForm = useContext(RequestFormContext);
    const [submitting, setSubmitting] = useState(false);
    const [searchParams] = useSearchParams();
    if (!requestForm) return null;
    
    const handleSubmit = async () => {
        if (!requestForm.questions.length) return;
        try {
            setSubmitting(true);
            const res = await fetch(`${BACKEND_URL}/api/woo-requests/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: requestForm.questions })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || 'Failed to submit request');
            }
            // Optionally clear form
            requestForm.setQuestions([]);
            alert('Your request was submitted and the analysis task was scheduled.');
        } catch (e: any) {
            alert(e?.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

  

    console.log("Request form questions", requestForm.questions);
    return (
        <div>
            <div className="h-[50vh] p-6 md:p-8 bg-[#F5F5F5] border-2 border-[#738DA7] mb-6">
                    <div>
                   
                    <p className="text-sm py-2">
                    <p className="text-sm py-2">Onderwerp: Informatie verzoek </p>

                    <p className="text-sm py-2">Geachte Heer/Mevrouw, </p>

                    <p className="text-sm py-2">Via deze mail doe ik het verzoek op grond van de Wet Open Overheid. Ik verzoek openbaring van de volgende informatie:</p>
                    </p>
                    {requestForm.questions.map((question) => (
                        <div key={question.question}>
                            <label className="block text-sm font-medium text-[#154273]">{question.question}</label>
                            {question.answer_loading ? <div className="text-sm text-[#154273]">Loading...</div> : <div className="text-sm text-[#154273]">{question.answer.answer}</div>}
                        </div>
                    ))}
                </div>
            </div>
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
        </div>
    );
};

export default RequestForm;