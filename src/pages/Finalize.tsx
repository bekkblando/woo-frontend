import RequestForm from "../components/RequestForm";
import { RequestFormContext } from "../context/RequestFormContext";
import { useSearchParams } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import Navbar from "../components/Navbar";
import SEO from "../components/SEO";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";

const Finalize = () => {
    const requestForm  = useContext(RequestFormContext);
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConversation = async () => {
        setLoading(true);
        const accessToken = searchParams.get("accessToken");
      if (accessToken) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/conversations/${accessToken}/`, { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            console.log("Data", data);
            if (data.documents && data.documents.length > 0 && requestForm) {
              requestForm.setUploadedDocuments(data.documents);
            }
            if (requestForm) {
                requestForm.setQuestions(
                    data.woo_request.questions.map(q => ({ ...q, answer: q.answer ? q.answer : null, answer_loading: q.answer ? false : true, saved: true })));
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
            <SEO
                title="MijnVerzoek - Finaliseer uw Woo verzoek"
                description="Hier maken we een verzoek voor u klaar. U kunt dit versturen via dit platform of kopiëren en aanpassen. Dan kunt u uw verzoek versturen per mail. Een informatieverzoek of juridisch bindend WOO-verzoek."
                keywords="WOO verzoek finaliseren, informatieverzoek versturen, WOO verzoek afronden, MijnVerzoek"
                ogTitle="MijnVerzoek - Finaliseer uw Woo verzoek"
                ogDescription="Hier maken we een verzoek voor u klaar. U kunt dit versturen via dit platform of kopiëren en aanpassen."
                ogUrl="/finalize"
                canonicalUrl="/finalize"
            />
            <Navbar />
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <IconLoader2 className="animate-spin h-8 w-8" />
                </div>
            ) : (
            <div className="px-12">
                <div className="text-2xl font-bold pt-4 pb-2">Mijn verzoek</div>
                <div className="text-sm pb-6 w-full md:w-1/2">
                  In dit venster zie je nu jouw verzoek. Wil je toch nog aanpassingen doen? Als je terug gaat naar de vorige pagina, kun je het verzoek verder bewerken. 
                  Ben je tevreden over het verzoek? Dan kun je hier het verzoek downloaden als bestand, of officieel indienen bij het Ministerie van Justitie en Veiligheid. 
                  <p className="pt-2">De knoppen staan rechts naast dit venster.</p>

                </div>
                    <RequestForm finalize={true} />
                </div>
            )}
      </div>
    );
};

export default Finalize;
