import Navbar from "../components/Navbar";
import StatusBar from "../components/ui/status-bar";

const Status = () => {
    return (
        <div className="w-full flex flex-col min-h-screen">
            <Navbar />
            <div className="flex flex-col items-center gap-8 p-8 mt-8">
                <h1 className="text-2xl font-bold text-[#154273]">Status</h1>
                <StatusBar size="lg" currentStep={2} />
            </div>
        </div>
    );
};

export default Status;