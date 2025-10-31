import { createContext, useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type Answer = {
  id: number;
  woo_question: number;
  answer: string;
  chunks: string[];
}
export type Question = {
  id: number;
  question: string;
  answer?: Answer;
  answer_loading?: boolean;
  saved?: boolean;
};

type RequestFormContextValue = {
  setQuestions: (value: Question[]) => void;
  questions: Question[];
  updateAnswer: (answer: Answer) => void;
};

export const RequestFormContext = createContext<RequestFormContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

export function RequestFormProvider({ children }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchParams] = useSearchParams();

  const updateAnswer = useCallback((answer: Answer) => {
    console.log("Updating answer", answer);
    setQuestions(questions => questions.map((q: Question) => q.id === answer.woo_question ? { ...q, answer: answer, saved: true, answer_loading: false } : q));
  }, []);

  useEffect(() => {
    const saveUnsavedQuestions = async () => {
        const wooRequestId = searchParams.get('wooRequestId');
        
        if (!wooRequestId) return;
        
        // Find all unsaved questions
        const unsavedQuestions = questions.filter((q: Question) => !q.saved);
        
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
                console.log("Care so little about the fate", data);
                
                // Mark the question as saved
                setQuestions(questions => questions.map((q: Question) => q.question === data.question ? { ...q, id: data.id, saved: true, answer_loading: data.answer?.id === undefined ? true : false, answer: data.answer, question: question.question } : q));

            } catch (e) {
                console.error("Failed to save question", e);
            }
        }
    };
    
    saveUnsavedQuestions();
}, [searchParams, questions]);

  console.log("Questions", questions);
  const value = useMemo<RequestFormContextValue>(
    () => ({
      questions,
      setQuestions,
      updateAnswer,
    }),
    [questions, updateAnswer]
  );

  return <RequestFormContext.Provider value={value}>{children}</RequestFormContext.Provider>;
}


