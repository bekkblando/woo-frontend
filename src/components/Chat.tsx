import { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useChat from "../hooks/useChat";
import TypewriterStreaming from "./ui/typewriter-streaming.tsx";
import {  IconMicrophone, IconSend2 } from "@tabler/icons-react";
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

    const functionCaller = async (_definition: { name: string; arguments: any }) => {
        console.log("Function caller", _definition);
        if (_definition.name === "woo_question_answered") {
            console.log("Updating answer", _definition.arguments);
            // Update the answer of the question in the request form
            // Pass all fields including details (with blocks) and answered status
            requestForm?.updateAnswer({ 
                id: _definition.arguments.id, 
                woo_question: _definition.arguments.woo_question, 
                answer: _definition.arguments.answer, 
                chunks: _definition.arguments.chunks || [],
                details: _definition.arguments.details || {},
                answered: _definition.arguments.answered
            });
            return;
        }
        if (_definition.name === "questions_added") {
            // Handle questions added by backend
            const data = _definition.arguments;
            if (!data.questions || !Array.isArray(data.questions) || !requestForm) return;

            // Transform backend question format to frontend format
            const newQuestionObjects = data.questions.map((q: any) => ({
                id: q.id || 0,
                question: q.question || "",
                answer: q.answer ? {
                    id: q.answer.id || 0,
                    answer: q.answer.answer || "",
                    chunks: q.answer.chunks || []
                } : { id: 0, answer: "", chunks: [] },
                answer_loading: !q.answer, // Loading if no answer yet
                saved: true // Questions from backend are already saved
            }));

            // Find new questions (by question text) to avoid duplicates
            const existingTexts = new Set(requestForm.questions.map(q => q.question));
            const uniqueNewQuestions = newQuestionObjects.filter(
                (q: any) => !existingTexts.has(q.question)
            );

            if (uniqueNewQuestions.length > 0) {
                requestForm.setQuestions([...requestForm.questions, ...uniqueNewQuestions]);
            }
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

    return (
        <div className="rounded-lg flex flex-col bg-[#EFF7FC] border-2 border-[#03689B]">
            <div className="flex-1 overflow-y-auto p-2 md:p-8">
                {messages.map((message: { role: string; content: string }, index: number) => (
                    <div key={index} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"} w-full mb-2`}>
                        <div className="max-w-[80%] bg-[#EFF7FC] border-2 border-[#03689B] p-2 rounded-mdwhitespace-pre-wrap text-[#154273]">
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
    );
};

export default Chat;