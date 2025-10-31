import { createContext, useMemo, useState } from "react";

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

export function RequestFormProvider({ children }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);

  const updateAnswer = (answer: Answer) => {
    console.log("Updating answer", answer);
    setQuestions(questions => questions.map((q: Question) => q.id === answer.woo_question ? { ...q, answer: answer, saved: true, answer_loading: false } : q));
  }
  console.log("Questions", questions);
  const value = useMemo<RequestFormContextValue>(
    () => ({
      questions,
      setQuestions,
      updateAnswer,
    }),
    [questions]
  );

  return <RequestFormContext.Provider value={value}>{children}</RequestFormContext.Provider>;
}


