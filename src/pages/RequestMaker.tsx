import Chat from '../components/Chat'
import RequestForm from '../components/RequestForm'
import { useSearchParams } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import { RequestFormContext } from '../context/RequestFormContext';
import Navbar from '../components/Navbar';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";

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
      <Navbar />
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
        <div className="px-6 w-1/2">
          <div className="text-2xl font-bold pb-4">MijnVerzoek</div>
          <div className="text-sm pb-6">Hier maken we een verzoek voor je klaar. Je kunt dit versturen via dit platform of kopieëren en aanpassen. Dan kun je jouw verzoek versturen per mail.</div>
            <RequestForm />
        </div>
      </div>
    </div>
    );
};

export default RequestMaker;