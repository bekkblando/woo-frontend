import Chat from '../components/Chat'
import RequestForm from '../components/RequestForm'
import { useSearchParams } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import { RequestFormContext } from '../context/RequestFormContext';
import { IconUser } from '@tabler/icons-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

interface Message {
  role: string;
  content: string;
}

interface WooRequestData {
  id: number;
  questions: { id: number; question: string; answer: { id: number; answer: string; chunks: string[] }; answer_loading: boolean }[];
}
interface ConversationData {
  id: number;
  title: string;
  created_at: string;
  messages: Message[];
  woo_request: WooRequestData;
}

const RequestMaker = () => {
    const requestForm = useContext(RequestFormContext);
    const [searchParams] = useSearchParams();
    const chatId = searchParams.get("chatId");
    const [initialMessages, setInitialMessages] = useState<Message[] | null>(null);
    const [loading, setLoading] = useState(false);
    

  useEffect(() => {
    const fetchConversation = async () => {
      if (chatId && !isNaN(parseInt(chatId))) {
        setLoading(true);
        try {
          const response = await fetch(`${BACKEND_URL}/api/conversations/${chatId}/`);
          if (response.ok) {
            const data: ConversationData = await response.json();
            console.log("Data", data);
            setInitialMessages(data.messages);
            if (requestForm) {
                requestForm.setQuestions(
                    data.woo_request.questions.map(q => ({ ...q, answer: q.answer ? { id: q.answer.id, answer: q.answer.answer, chunks: [] } : null, answer_loading: q.answer ? false : true, saved: true })));
            }
          } else {
            console.error('Failed to fetch conversation');
            setInitialMessages(null);
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
          setInitialMessages(null);
        } finally {
          setLoading(false);
        }
      } else {
        setInitialMessages(null);
      }
    };

    fetchConversation();
  }, []);



    return (
      <div className="w-full flex flex-col justify-center">
        <div className="w-full flex justify-between items-center px-2">
      <div className="text-[15px] font-bold">
          VraagMijnOverheid
      </div>
      <img src="/public/government-logo.png" alt="Woo Logo" className="h-12" />
      <div className="text-sm text-[#154475]">
          <IconUser className="inline-block"/>
          <span className="inline-block ml-2 justify-center items-center pt-1">Inloggen</span>
      </div>
      </div>
      <div className="bg-[#EFF7FC] w-full h-4"></div>
      <div className="bg-[#f7f7f7] flex gap-12 p-6">
        <div className="w-1/2">
         <div className="text-2xl font-bold pb-4">MijnVraag</div>
         <div className="text-sm pb-6">Bespreek hier jouw vraag.</div>
          {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-[#154273]">Loading conversation...</div>
          </div>
          ) : (
            <Chat initialMessages={initialMessages} />
          )}
        </div>
        <div className="w-1/2">
          <div className="text-2xl font-bold pb-4">MijnVerzoek</div>
          <div className="text-sm pb-6">Hier maken we een verzoek voor je klaar. Je kunt dit versturen via dit platform of kopieëren en aanpassen. Dan kun je jouw verzoek versturen per mail.</div>
            <RequestForm />
        </div>
      </div>
    </div>
    );
};

export default RequestMaker;