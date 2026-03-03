import Navbar from "../components/Navbar";
import SEO from "../components/SEO";

const CompletedRequest = () => {
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-[#154273] mb-4">Uw WOO verzoek is ingediend</h1>
                </div>
            </div>
        </div>
    );
};

export default CompletedRequest;