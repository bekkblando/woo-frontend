import { createContext, useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getCSRFHeaders } from "../hooks/authentication_helper";

export type Answer = {
  id: number;
  woo_question: number;
  answer: string;
  answered?: "yes" | "no" | "partial";
  details?: {
    blocks?: Array<{
      type?: string;
      content?: string;
      quote?: string;
      formatted_quote?: string;
      no_validated_quote?: boolean;
      chunk_id?: string;
      document_id?: string;
      page_number?: number;
    }>;
  };
  chunks?: Array<{
    id: string;
    content: {
      id?: string;
      content?: {
        url?: string;
        chunk_text?: string;
        chunk_index?: number;
      };
      document?: string;
    };
  }>;
}
export type Question = {
  id: number;
  question: string;
  answer?: Answer;
  answer_loading?: boolean;
  saved?: boolean;
};

export type UploadedDocument = {
  s3_key: string;
  filename: string;
  content_type: string;
  size?: number;
};

type RequestFormContextValue = {
  setQuestions: (value: Question[] | ((prev: Question[]) => Question[])) => void;
  questions: Question[];
  updateAnswer: (answer: Answer) => void;
  uploadedDocuments: UploadedDocument[];
  setUploadedDocuments: (value: UploadedDocument[] | ((prev: UploadedDocument[]) => UploadedDocument[])) => void;
  removeUploadedDocument: (s3Key: string) => Promise<void>;
};

export const RequestFormContext = createContext<RequestFormContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";

export function RequestFormProvider({ children }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [searchParams] = useSearchParams();

  const updateAnswer = useCallback((answer: Answer) => {
    console.log("Updating answer", answer);
    setQuestions(questions => questions.map((q: Question) => q.id === answer.woo_question ? { ...q, answer: answer, saved: true, answer_loading: false } : q));
  }, []);

  const removeUploadedDocument = useCallback(async (s3Key: string) => {
    const accessToken = searchParams.get('accessToken');
    if (!accessToken) return;
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/conversations/${accessToken}/documents/delete/`,
        {
          method: 'DELETE',
          headers: getCSRFHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ s3_key: s3Key }),
          credentials: 'include'
        }
      );
      if (res.ok || res.status === 204) {
        setUploadedDocuments(prev => prev.filter(d => d.s3_key !== s3Key));
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  }, [searchParams]);

  useEffect(() => {
    const saveUnsavedQuestions = async () => {
        const accessToken = searchParams.get('accessToken');
        
        if (!accessToken) return;
        
        // Find all unsaved questions
        const unsavedQuestions = questions.filter((q: Question) => !q.saved);
        
        if (unsavedQuestions.length === 0) return;
        
        // Save each unsaved question
        for (const question of unsavedQuestions) {
            try {
                const res = await fetch(`${BACKEND_URL}/api/woo-questions/`, {
                    method: 'POST',
                    headers: getCSRFHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ 
                        question: question.question, 
                        access_token: accessToken 
                    }),
                    credentials: 'include'
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
      uploadedDocuments,
      setUploadedDocuments,
      removeUploadedDocument,
    }),
    [questions, updateAnswer, uploadedDocuments, removeUploadedDocument]
  );

  return <RequestFormContext.Provider value={value}>{children}</RequestFormContext.Provider>;
}

