import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";

const Privacy = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full min-h-screen flex flex-col">
            <SEO
                title="MijnVerzoek - Privacy & Persoonsgegevens"
                description="Informatie over de verwerking van uw persoonsgegevens bij het indienen van een Woo-verzoek bij het Ministerie van Justitie en Veiligheid."
                keywords="privacy, persoonsgegevens, Woo-verzoek, Ministerie van Justitie en Veiligheid"
                ogTitle="MijnVerzoek - Privacy & Persoonsgegevens"
                ogDescription="Informatie over de verwerking van uw persoonsgegevens bij het indienen van een Woo-verzoek."
                ogUrl="/privacy"
                canonicalUrl="/privacy"
            />
            <Navbar />

            <div className="p-5 py-12 mt-8 md:mt-18 flex flex-col gap-4 overflow-scroll max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="self-start flex items-center gap-1 text-[#03689B] hover:underline text-sm mb-2"
                >
                    <IconArrowLeft className="w-4 h-4" />
                    Terug
                </button>

                <h1 className="text-3xl font-bold text-[#154273]">
                    Informatie over de verwerking van uw persoonsgegevens
                </h1>

                <h2 className="text-xl font-semibold text-[#154273] mt-4">1. Gebruik van dit formulier</h2>
                <p className="text-sm leading-relaxed text-gray-700">
                    Dit formulier kan worden gebruikt om een Woo-verzoek in te dienen bij het bestuursdepartement van het Ministerie van Justitie en Veiligheid. De informatie die in dit formulier wordt verstrekt, wordt gebruikt om het Woo-verzoek te behandelen. Zonder de informatie uit dit formulier kunnen wij uw verzoek niet behandelen.
                </p>

                <h2 className="text-xl font-semibold text-[#154273] mt-4">2. Bewaring van uw gegevens</h2>
                <p className="text-sm leading-relaxed text-gray-700">
                    Uw gehele verzoek, inclusief persoonsgegevens, wordt op grond van de Archiefwet en de selectielijsten van het Ministerie van Justitie en Veiligheid permanent bewaard. Twintig jaar na sluiting van het dossier wordt het overgebracht naar het Nationaal Archief; openbaarmaking van dergelijke dossiers vindt pas 75 jaar na sluiting van het dossier plaats.
                </p>

                <h2 className="text-xl font-semibold text-[#154273] mt-4">3. Doorsturen naar een ander bestuursorgaan</h2>
                <p className="text-sm leading-relaxed text-gray-700">
                    Indien uw verzoek niet door het Ministerie van Justitie en Veiligheid kan worden beantwoord maar (waarschijnlijk) door een ander bestuursorgaan, verplicht de Wet open overheid het ministerie om uw Woo-verzoek door te sturen naar het juiste orgaan. In dergelijke gevallen worden uw gehele verzoek, inclusief uw persoonsgegevens, gedeeld met het betreffende bestuursorgaan.
                </p>

                <h2 className="text-xl font-semibold text-[#154273] mt-4">4. Uw rechten</h2>
                <p className="text-sm leading-relaxed text-gray-700">
                    Op grond van de Algemene Verordening Gegevensbescherming (AVG) heeft u het recht op inzage, rectificatie en verwijdering van uw persoonsgegevens, voor zover dit niet in strijd is met wettelijke bewaarverplichtingen. U kunt hiervoor een verzoek indienen bij het Ministerie van Justitie en Veiligheid.
                </p>

                <h2 className="text-xl font-semibold text-[#154273] mt-4">5. Toestemmingsverklaring</h2>
                <p className="text-sm leading-relaxed text-gray-700">
                    Door het indienen van uw Woo-verzoek via dit formulier verklaart u dat u de bovenstaande informatie over de verwerking van uw persoonsgegevens heeft gelezen en begrepen.
                </p>

                <h2 className="text-xl font-semibold text-[#154273] mt-4">6. Contact</h2>
                <p className="text-sm leading-relaxed text-gray-700">
                    Voor vragen over de verwerking van uw persoonsgegevens kunt u contact opnemen met het Ministerie van Justitie en Veiligheid.
                </p>
            </div>
            <Footer />
        </div>
    );
};

export default Privacy;
