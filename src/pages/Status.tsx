import Navbar from "../components/Navbar";
import StatusBar from "../components/ui/status-bar";
import SEO from "../components/SEO";

const Status = () => {
    return (
        <div className="w-full flex flex-col min-h-screen">
            <SEO
                title="Status - Volg uw WOO verzoek"
                description="Volg de status van uw informatieverzoek of WOO-verzoek. Zie met welke stap de ambtenaar bezig is met eerlijke verwachtingen en transparantie."
                keywords="WOO verzoek status, informatieverzoek status, volg verzoek, transparantie"
                ogTitle="Status - Volg uw WOO verzoek"
                ogDescription="Volg de status van uw informatieverzoek of WOO-verzoek met eerlijke verwachtingen en transparantie."
                ogUrl="/status"
                canonicalUrl="/status"
            />
            <Navbar />
            <div className="flex flex-col items-center gap-8 p-8 mt-8">
                <h1 className="text-2xl font-bold text-[#154273]">Status</h1>
                <StatusBar size="lg" currentStep={2} />
            </div>
        </div>
    );
};

export default Status;