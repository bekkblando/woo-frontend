
import './App.css'
import Chat from './components/Chat'
import RequestForm from './components/RequestForm'
import { RequestFormProvider } from './context/RequestFormContext'
import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

interface Message {
  role: string;
  content: string;
}

interface ConversationData {
  id: number;
  title: string;
  created_at: string;
  messages: Message[];
}

function App() {
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
            setInitialMessages(data.messages);
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
  }, [chatId]);

  return (
    <RequestFormProvider>
      <div className="h-screen min-h-screen bg-[#f7f7f7] flex">
        <div className="w-[35%] min-w-[320px] h-full border-r border-[#154273]/10 bg-white">
          <RequestForm />
        </div>
        <div className="flex-1 h-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-[#154273]">Loading conversation...</div>
            </div>
          ) : (
            <Chat initialMessages={initialMessages} />
          )}
        </div>
      </div>
    </RequestFormProvider>
  )
}

export default App
