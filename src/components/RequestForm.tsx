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

    useEffect(() => {
        const saveUnsavedQuestions = async () => {
            const wooRequestId = searchParams.get('wooRequestId');
            
            if (!wooRequestId) return;
            
            // Find all unsaved questions
            const unsavedQuestions = requestForm.questions.filter(q => !q.saved);
            
            if (unsavedQuestions.length === 0) return;
            
            // Save each unsaved question
            for (const question of unsavedQuestions) {
                try {
                    const res = await fetch(`${BACKEND_URL}/api/woo-questions/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            question: question.question, 
                            woo_request: parseInt(wooRequestId) 
                        })
                    });
                    
                    if (!res.ok) {
                        throw new Error(`Failed to save question: ${question.question}`);
                    }
                    
                    const data = await res.json();
                    
                    // Mark the question as saved
                    requestForm.setQuestions(requestForm.questions.map(q => 
                        q.question === question.question 
                            ? { ...q, id: data.id, saved: true } 
                            : q
                    ));
                } catch (e) {
                    console.error("Failed to save question", e);
                }
            }
        };
        
        saveUnsavedQuestions();
    }, [searchParams, requestForm.questions, requestForm.setQuestions]);

    console.log("Request form questions", requestForm.questions);
    return (
        <div className="h-full p-6 md:p-8 bg-white">
            <h1 className="text-2xl font-semibold text-[#154273]">Request Form</h1>
            <div className="mt-4">
                {requestForm.questions.map((question) => (
                    <div key={question.question}>
                        <label className="block text-sm font-medium text-[#154273]">{question.question}</label>
                        {question.answer_loading ? <div className="text-sm text-[#154273]">Loading...</div> : <div className="text-sm text-[#154273]">{question.answer.answer}</div>}
                    </div>
                ))}
            </div>
            <div className="mt-6">
                <button onClick={handleSubmit} disabled={submitting} className="bg-[#154273] text-white px-4 py-2 rounded disabled:opacity-60">
                    {submitting ? 'Submitting…' : 'Submit'}
                </button>
            </div>
        </div>
    );
};

export default RequestForm;