import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
            <div className="flex flex-col items-center gap-8 p-8 mt-8 max-w-xl mx-auto w-full">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#154273]">Status van uw verzoek</h1>
                    <p className="text-sm text-[#154273]/60 mt-2">
                        Hieronder ziet u de voortgang van uw informatieverzoek.
                    </p>
                </div>
                <div className="w-full bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <StatusBar size="lg" currentStep={2} />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Status;