import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { IconLoader2 } from "@tabler/icons-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import RequestForm from "../components/RequestForm";
import { useChatContext } from "../context/ChatContext";

const CompletedRequest = () => {
    const [searchParams] = useSearchParams();
    const { loadConversation, loading } = useChatContext();
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        if (accessToken && initialLoad) {
            setInitialLoad(false);
            loadConversation(accessToken);
        }
    }, [searchParams, loadConversation, initialLoad]);

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