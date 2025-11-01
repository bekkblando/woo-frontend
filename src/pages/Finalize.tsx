import RequestForm from "../components/RequestForm";
import { RequestFormContext } from "../context/RequestFormContext";
import { useSearchParams } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { IconLoader2 } from "@tabler/icons-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const Finalize = () => {
    const requestForm  = useContext(RequestFormContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);


  useEffect(() => {
    const fetchConversation = async () => {
        setLoading(true);
        const chatId = searchParams.get("chatId");
      if (chatId && !isNaN(parseInt(chatId))) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/conversations/${chatId}/`);
          if (response.ok) {
            const data = await response.json();
            console.log("Data", data);
            if (requestForm) {
                requestForm.setQuestions(
                    data.woo_request.questions.map(q => ({ ...q, answer: q.answer ? { id: q.answer.id, answer: q.answer.answer, chunks: [] } : null, answer_loading: q.answer ? false : true, saved: true })));
            }
          } else {
            console.error('Failed to fetch conversation');
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
        } finally {
          setLoading(false);
        }
    };
    }
    fetchConversation();
  }, [searchParams]);


    return (
        <div className="w-full flex flex-col justify-center">
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <IconLoader2 className="animate-spin h-8 w-8" />
                </div>
            ) : (
            <div className="w-1/2">
                <div className="text-2xl font-bold pb-4">MijnVerzoek</div>
                <div className="text-sm pb-6">Hier maken we een verzoek voor je klaar. Je kunt dit versturen via dit platform of kopieëren en aanpassen. Dan kun je jouw verzoek versturen per mail.</div>
                    <RequestForm finalize={true} />
                </div>
            )}
      </div>
    );
};

export default Finalize;