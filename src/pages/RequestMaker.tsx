import Chat from '../components/Chat'
import RequestForm from '../components/RequestForm'
import { useSearchParams } from 'react-router-dom'
import { useContext, useEffect, useState, useRef } from 'react'
import { RequestFormContext } from '../context/RequestFormContext';
import Navbar from '../components/Navbar';
import { Sheet } from 'react-modal-sheet';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const hasQuestions = Boolean(requestForm?.questions && requestForm.questions.length > 0);
    const [isSheetOpen, setIsSheetOpen] = useState(hasQuestions);
    const [isMobile, setIsMobile] = useState(false);
    
    // Track previous state for detecting changes
    const prevQuestionsRef = useRef<Array<{ id: number; question: string; answer?: any; answer_loading?: boolean; saved?: boolean }>>([]);
    const lastQuestionAddedNotificationRef = useRef<number>(0);
    const lastQuestionAnsweredNotificationRef = useRef<number>(0);
    const DEBOUNCE_TIME = 30000; // 30 seconds

  // Check if we're on mobile/tablet (below lg breakpoint which is 1024px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sheet when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile && isSheetOpen) {
      setIsSheetOpen(false);
    }
  }, [isMobile, isSheetOpen]);

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
                    data.woo_request.questions.map(q => ({ ...q, answer: q.answer ? { id: q.answer.id, woo_question: q.id, answer: q.answer.answer, chunks: [] } : undefined, answer_loading: q.answer ? false : true, saved: true })));
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

  // Update sheet state when questions are removed (close if no questions)
  useEffect(() => {
    const questionsExist = Boolean(requestForm?.questions && requestForm.questions.length > 0);
    if (!questionsExist) {
      setIsSheetOpen(false);
    }
    // Don't automatically open when new questions are added
  }, [requestForm?.questions]);

  // Initialize prevQuestionsRef on first load
  useEffect(() => {
    if (requestForm?.questions && prevQuestionsRef.current.length === 0) {
      prevQuestionsRef.current = [...requestForm.questions];
    }
  }, [requestForm?.questions]);

  // Track questions and answers changes for notifications
  useEffect(() => {
    if (!requestForm?.questions) return;

    const prevQuestions = prevQuestionsRef.current || [];
    const currentQuestions = requestForm.questions;

    // Check for new questions added
    if (currentQuestions.length > prevQuestions.length) {
      const now = Date.now();
      if (now - lastQuestionAddedNotificationRef.current > DEBOUNCE_TIME) {
        const newQuestionsCount = currentQuestions.length - prevQuestions.length;
        toast.info(
          newQuestionsCount === 1 
            ? 'Nieuwe vraag toegevoegd' 
            : `${newQuestionsCount} nieuwe vragen toegevoegd`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        lastQuestionAddedNotificationRef.current = now;
      }
    }

    // Check for answers added
    const prevAnsweredCount = prevQuestions.filter((q: { answer?: any; answer_loading?: boolean }) => q.answer && !q.answer_loading).length;
    const currentAnsweredCount = currentQuestions.filter((q: { answer?: any; answer_loading?: boolean }) => q.answer && !q.answer_loading).length;
    
    if (currentAnsweredCount > prevAnsweredCount) {
      const now = Date.now();
      if (now - lastQuestionAnsweredNotificationRef.current > DEBOUNCE_TIME) {
        const newAnswersCount = currentAnsweredCount - prevAnsweredCount;
        toast.success(
          newAnswersCount === 1 
            ? 'Vraag beantwoord' 
            : `${newAnswersCount} vragen beantwoord`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        lastQuestionAnsweredNotificationRef.current = now;
      }
    }

    // Update previous questions reference
    prevQuestionsRef.current = currentQuestions;
  }, [requestForm?.questions]);



    return (
      <div className="w-full flex flex-col h-full justify-center">
      <Navbar />
      <div 
        className="bg-[#f7f7f7] h-full flex flex-col min-h-screen lg:flex-row gap-6 lg:gap-12 p-4 md:p-6"
        onClick={(e) => {
          // Close sheet when clicking on the main content area (not on interactive elements or the sheet itself)
          const target = e.target as HTMLElement;
          if (
            isSheetOpen && 
            hasQuestions && 
            !target.closest('[data-sheet-container]') &&
            !target.closest('button') &&
            !target.closest('input') &&
            !target.closest('a') &&
            !target.closest('[role="button"]')
          ) {
            setIsSheetOpen(false);
          }
        }}
      >
        <div className="w-full max-h-[100vh] overflow-y-auto lg:w-1/2">
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
        {/* Desktop: Show RequestForm in sidebar */}
        <div className="hidden lg:block px-6 w-1/2">
          <div className="text-2xl font-bold pb-4">MijnVerzoek</div>
          <div className="text-sm pb-6">Hier maken we een verzoek voor je klaar. Je kunt dit versturen via dit platform of kopieëren en aanpassen. Dan kun je jouw verzoek versturen per mail.</div>
            <RequestForm />
        </div>
        {/* Mobile/Tablet: Button to open bottom sheet - only show if questions exist */}
        {hasQuestions && (
          <div className="lg:hidden fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setIsSheetOpen(true)}
              className="bg-[#F68153] text-white px-6 py-3 rounded-lg shadow-lg font-medium hover:bg-[#F68153]/90 transition-colors"
            >
              Kijkt MijnVerzoek
            </button>
          </div>
        )}
      </div>
      {/* Bottom Sheet for Mobile/Tablet - only show if questions exist and on mobile */}
      {hasQuestions && isMobile && (
        <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} snapPoints={[600, 120]} initialSnap={1} disableDrag={false}>
        <Sheet.Container data-sheet-container>
          <Sheet.Header />
          <Sheet.Content>
            <div className="px-4 md:px-6 pb-6">
              <div className="text-2xl font-bold pb-4">MijnVerzoek</div>
              <div className="text-sm pb-6">Hier maken we een verzoek voor je klaar. Je kunt dit versturen via dit platform of kopieëren en aanpassen. Dan kun je jouw verzoek versturen per mail.</div>
              <RequestForm />
            </div>
          </Sheet.Content>
        </Sheet.Container>
      </Sheet>
      )}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
    );
};

export default RequestMaker;