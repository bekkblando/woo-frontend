import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const CompletedRequest = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const wooRequestId = searchParams.get("wooRequestId");
    return (
        <div>
            <Navbar />
            <div className="w-1/2 flex flex-col gap-6 px-6 text-left items-center justify-start">
            <div className="text-2xl font-bold self-start">MijnVerzoek • <span className="text-gray-500">aangevraagd</span></div>
            <p>Je verzoek is ingediend. Druk op de knop Status om te zien hoe het ervoor staat.</p>
            <a href={`/status?wooRequestId=${wooRequestId}`} className="self-start text-2xl display-inline-block bg-[#F68153] self-end text-white px-12 py-2">Status</a>
            </div>
        </div>
    );
};

export default CompletedRequest;