import { useState } from "react";
import { IconMicrophone, IconSend2 } from "@tabler/icons-react";
import { IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";
const Landing = () => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const submitContent = async () => {
        setLoading(true);
        console.log(content);
        // Send message via HTTP POST instead of WebSocket
        const response = await fetch(`${BACKEND_URL}/api/conversations/send-message/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversation_id: null,
                message: content
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();
        // Update conversationId if we got a new one
        navigate(`/request?chatId=${data.conversation_id}&wooRequestId=${data.woo_request_id}`);
        setLoading(false);
    }

    return (
        <div>
            <div className="w-full flex flex-col justify-center">
            <div className="w-full flex justify-between items-center px-2">
            <div className="text-[15px] font-bold">
                VraagMijnOverheid
            </div>
            <img src="/government-logo.png" alt="Woo Logo" className="h-12" />
            <div className="text-sm text-[#154475]">
                <IconUser className="inline-block"/>
                <span className="inline-block ml-2 justify-center items-center pt-1">Inloggen</span>
            </div>
            </div>
            <div className="bg-[#EFF7FC] w-full h-4"></div>
            <div>
            <div>
                
            </div>
            </div>

            <div className="w-1/3 self-center">
            <div className="text-2xl font-bold pt-22 pb-4">VraagMijnOverheid</div>
            <div className="pb-6">
                <p>Wil je iets weten van de overheid? Dan kan je die vraag hier stellen. Je kunt ons alles vragen. We gaan je vervolgens zo goed mogelijk helpen om die informatie 
                Zo houden we de Overheid transparent en betrouwbaar. </p>
            </div>
            <div className="px-2">
            <div className="rounded-lg h-1/3 flex flex-col bg-[#EFF7FC] border-2 border-[#03689B]">
            <div className="flex-1 overflow-y-auto p-2 md:p-8">
            </div>
            <div className="px-2 flex items-center gap-2">
                <input
                    className="flex-1 bg-transparent text-[#154273] text-lg outline-none placeholder:text-[#154273]/60 border-0 py-4"
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Hoe kunnen we je helpen? Stel hier je vraag."
                    onKeyDown={(e) => {
                        if (e.key === "Enter") submitContent();
                    }}
                />
                <IconMicrophone className="inline-block"/>
                <button className="px-3 py-1" onClick={submitContent} aria-label="Send">
                    <IconSend2 />
                </button>
            </div>
        </div>
            </div>
            <div className="pt-6">
                <p>Heeft u al een informatieverzoek of WOO-verzoek gedaan? 
                Log in om te bekijken hoe het ervoor staat.</p>
            </div>
            <div className="text-sm font-bold text-[#154475] pt-6">
                {'>'} Worstel je met het stellen van je vraag? 
                Kijk deze video die je op weg helpt. 
            </div>
            </div>
        </div>
    </div>
    )
}

export default Landing;