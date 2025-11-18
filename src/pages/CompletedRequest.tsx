import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import SEO from "../components/SEO";

const CompletedRequest = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const wooRequestId = searchParams.get("wooRequestId");
    return (
        <div>
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
            <div className="w-1/2 flex flex-col gap-6 px-6 text-left items-center justify-start">
            <div className="text-2xl font-bold self-start">MijnVerzoek • <span className="text-gray-500">aangevraagd</span></div>
            <p className="text-left self-start">Je verzoek is ingediend. Druk op de knop Status om te zien hoe het ervoor staat.</p>
            <a href={`/status?wooRequestId=${wooRequestId}`} className="self-start text-2xl display-inline-block bg-[#F68153] self-end text-white px-12 py-2">Status</a>
            </div>
        </div>
    );
};

export default CompletedRequest;