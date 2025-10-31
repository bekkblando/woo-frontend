import { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useChat from "../hooks/useChat";
import TypewriterStreaming from "./ui/typewriter-streaming.tsx";
import { IconSend } from "@tabler/icons-react";
import { RequestFormContext } from "../context/RequestFormContext.tsx";

interface ChatProps {
    initialMessages?: { role: string; content: string }[] | null;
}

const Chat = ({ initialMessages }: ChatProps) => {
    const [searchParams] = useSearchParams();
    const chatId = searchParams.get("chatId");
    const [content, setContent] = useState<string>("");
    const bottomOfChatContainer = useRef<HTMLDivElement | null>(null);
    const requestForm = useContext(RequestFormContext);
    const functionCaller = (_definition: { name: string; arguments: any }) => {


        console.log("Function caller", _definition);
        if (_definition.name === "set_name") {
            // Parse the arguments
            const args: any = JSON.parse(_definition.arguments);
            console.log("Setting name", args.name);
            requestForm?.setName(args.name);
        }
    };
    const { messages, animatedText, sendMessage, currentMessageKey } = useChat(chatId, functionCaller, "Hello, how can I help you?", initialMessages);

    useEffect(() => {
        if (bottomOfChatContainer.current) {
            bottomOfChatContainer.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, animatedText]);

    const submitContent = () => {
        if (!content.trim()) return;
        sendMessage(content);
        setContent("");
    };

    console.log("Animated text in chat component", animatedText);
    console.log("Messages in chat component", messages);
    return (
        <div className="h-full flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {messages.map((message: { role: string; content: string }, index: number) => (
                    <div key={index} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"} w-full mb-2`}>
                        <div className="max-w-[80%] whitespace-pre-wrap text-[#154273]">
                            {message.content === animatedText ? null : message.content}
                        </div>
                    </div>
                ))}
                {animatedText !== "" && (
                    <TypewriterStreaming
                        currentMessageKey={currentMessageKey}
                        animatedText={animatedText}
                        animationCallback={() => {}}
                    />
                )}
                <div ref={bottomOfChatContainer} />
            </div>
            <div className="p-3 flex items-center gap-2 border-t border-[#154273]/20 bg-white">
                <input
                    className="flex-1 bg-white text-[#154273] text-base outline-none placeholder:text-[#154273]/60 border border-[#154273]/30 rounded px-3 py-2"
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a message"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") submitContent();
                    }}
                />
                <button className="bg-[#154273] text-white px-3 py-2 rounded" onClick={submitContent} aria-label="Send">
                    <IconSend />
                </button>
            </div>
        </div>
    );
};

export default Chat;