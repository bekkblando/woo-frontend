import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const CompletedRequest = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const wooRequestId = searchParams.get("wooRequestId");
    return (
        <div>
            <Navbar />
            <h1>Your request has been submitted</h1>
            <p>You will receive an email with updates.</p>
            <a href={`/status?wooRequestId=${wooRequestId}`} className="text-blue-500">You can also check the status of your request here.</a>
        </div>
    );
};

export default CompletedRequest;