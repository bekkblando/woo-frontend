import { useEffect, useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { IconLoader2 } from "@tabler/icons-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import RequestForm from "../components/RequestForm";
import { RequestFormContext } from "../context/RequestFormContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";

const CompletedRequest = () => {
    const [searchParams] = useSearchParams();
    const requestForm = useContext(RequestFormContext);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchConversation = async () => {
            setLoading(true);
            const accessToken = searchParams.get("accessToken");
            if (accessToken && requestForm) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/conversations/${accessToken}/`, { credentials: 'include' });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.documents && data.documents.length > 0) {
                            requestForm.setUploadedDocuments(data.documents);
                        }
                        if (data.woo_request?.questions) {
                            requestForm.setQuestions(
                                data.woo_request.questions.map((q: any) => ({
                                    id: q.id,
                                    question: q.question,
                                    answer: q.answer
                                        ? {
                                              id: q.answer.id,
                                              woo_question: q.id,
                                              answer: q.answer.answer,
                                              chunks: q.answer.chunks || [],
                                              details: q.answer.details || {},
                                              answered: q.answer.answered,
                                          }
                                        : undefined,
                                    status: q.status,
                                    answer_loading: q.status === "processing" || q.status === "pending",
                                    answer_failed: q.status === "failed",
                                    error_message: q.error_message || "",
                                    saved: true,
                                }))
                            );
                        }
                    } else {
                        console.error('Failed to fetch conversation');
                    }
                } catch (error) {
                    console.error('Error fetching conversation:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchConversation();
    }, [searchParams, requestForm]);

    return (
        <div className="min-h-screen flex flex-col">
            <SEO
                title="MijnVerzoek - Verzoek ingediend"
                description="Uw verzoek is ingediend. Volg de status van uw informatieverzoek of WOO-verzoek om te zien hoe het ervoor staat."
                keywords="WOO verzoek ingediend, informatieverzoek ingediend, verzoek status"
                ogTitle="MijnVerzoek - Verzoek ingediend"
                ogDescription="Uw verzoek is ingediend. Volg de status om te zien hoe het ervoor staat."
                ogUrl="/completed-request"
                canonicalUrl="/completed-request"
            />
            <Navbar />
            {loading ? (
                <div className="flex justify-center items-center flex-1">
                    <IconLoader2 className="animate-spin h-8 w-8 text-[#154273]" />
                </div>
            ) : (
                <div className="px-12 flex-1 pb-12">
                    <div className="text-2xl font-bold pt-4 pb-2">Uw WOO verzoek is ingediend</div>
                    <div className="text-sm pb-6 w-full md:w-1/2">
                        Uw verzoek is succesvol ingediend. Hieronder ziet u een overzicht van uw verzoek. 
                        U kunt het verzoek downloaden als PDF-bestand of per e-mail ontvangen.
                    </div>
                    <RequestForm readOnly={true} />
                </div>
            )}
            <Footer />
        </div>
    );
};

export default CompletedRequest;