import { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useChat from "../hooks/useChat";
import TypewriterStreaming from "./ui/typewriter-streaming.tsx";
import { IconMicrophone, IconPaperclip, IconSend2, IconX } from "@tabler/icons-react";
import { RequestFormContext } from "../context/RequestFormContext.tsx";
import ReactMarkdown from "react-markdown";

const ALLOWED_EXTENSIONS = [
    "pdf", "csv", "jsonl", "xml", "txt", "json",
    "md", "html", "docx", "xlsx", "tsv",
    "yaml", "yml", "log",
];
const ACCEPT_STRING = ALLOWED_EXTENSIONS.map(e => `.${e}`).join(",");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 2;

interface ChatProps {
    initialMessages?: { role: string; content: string }[] | null;
}

const Chat = ({ initialMessages }: ChatProps) => {
    const [searchParams] = useSearchParams();
    const chatId = searchParams.get("chatId");
    const [content, setContent] = useState<string>("");
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string>("");
    const bottomOfChatContainer = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const requestForm = useContext(RequestFormContext);

    const functionCaller = async (_definition: { name: string; arguments: any }) => {
        console.log("Function caller", _definition);
        if (_definition.name === "woo_question_answered") {
            console.log("Updating answer", _definition.arguments);
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
            const data = _definition.arguments;
            if (!data.questions || !Array.isArray(data.questions) || !requestForm) return;

            const newQuestionObjects = data.questions.map((q: any) => ({
                id: q.id || 0,
                question: q.question || "",
                answer: q.answer ? {
                    id: q.answer.id || 0,
                    answer: q.answer.answer || "",
                    chunks: q.answer.chunks || []
                } : { id: 0, answer: "", chunks: [] },
                answer_loading: !q.answer,
                saved: true
            }));

            const existingTexts = new Set(requestForm.questions.map(q => q.question));
            const uniqueNewQuestions = newQuestionObjects.filter(
                (q: any) => !existingTexts.has(q.question)
            );

            if (uniqueNewQuestions.length > 0) {
                requestForm.setQuestions([...requestForm.questions, ...uniqueNewQuestions]);
            }
        }
    };

    const {
        messages,
        animatedText,
        sendMessage,
        currentMessageKey,
        uploadedDocuments,
        removeDocument,
    } = useChat(chatId, functionCaller, "Hello, how can I help you?", initialMessages);

    useEffect(() => {
        if (bottomOfChatContainer.current) {
            bottomOfChatContainer.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, animatedText]);

    // --- File handling ---
    const totalAttachedCount = pendingFiles.length + uploadedDocuments.length;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError("");
        const selected = Array.from(e.target.files || []);
        if (selected.length === 0) return;

        // Check total count
        if (totalAttachedCount + selected.length > MAX_FILES) {
            setFileError(`U kunt maximaal ${MAX_FILES} documenten bijvoegen.`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        // Validate each file
        for (const file of selected) {
            const ext = file.name.rsplit ? "" : file.name.split(".").pop()?.toLowerCase() || "";
            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                setFileError(`Bestandstype '.${ext}' is niet toegestaan.`);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                setFileError(`'${file.name}' is groter dan 5MB.`);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
        }

        setPendingFiles(prev => [...prev, ...selected]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
        setFileError("");
    };

    const submitContent = () => {
        if (!content.trim() && pendingFiles.length === 0) return;
        sendMessage(content, pendingFiles.length > 0 ? pendingFiles : undefined);
        setContent("");
        setPendingFiles([]);
        setFileError("");
    };

    return (
        <div className="rounded-lg flex flex-col bg-[#EFF7FC] border-2 border-[#03689B]">
            <div className="flex-1 overflow-y-auto p-2 md:p-8">
                {messages.map((message: { role: string; content: string }, index: number) => (
                    <div key={index} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"} w-full mb-2`}>
                        <div className="max-w-[80%] bg-[#EFF7FC] border-2 border-[#03689B] p-2 rounded-md text-[#154273] prose prose-sm prose-blue max-w-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_p]:my-2">
                            {message.content === animatedText ? null : (
                                <ReactMarkdown
                                    components={{
                                        a: ({ href, children }) => (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline hover:text-blue-800"
                                            >
                                                {children}
                                            </a>
                                        ),
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            )}
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

            {/* Attached files chips */}
            {(uploadedDocuments.length > 0 || pendingFiles.length > 0) && (
                <div className="px-3 pt-2 flex flex-wrap gap-2">
                    {uploadedDocuments.map((doc) => (
                        <span
                            key={doc.s3_key}
                            className="inline-flex items-center gap-1 bg-[#03689B]/10 text-[#154273] text-xs px-2 py-1 rounded-full"
                        >
                            {doc.filename}
                            <button
                                onClick={() => removeDocument(doc.s3_key)}
                                className="hover:text-red-600 transition-colors"
                                aria-label={`Verwijder ${doc.filename}`}
                            >
                                <IconX className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    {pendingFiles.map((file, idx) => (
                        <span
                            key={`pending-${idx}`}
                            className="inline-flex items-center gap-1 bg-[#F68153]/15 text-[#154273] text-xs px-2 py-1 rounded-full"
                        >
                            {file.name}
                            <button
                                onClick={() => removePendingFile(idx)}
                                className="hover:text-red-600 transition-colors"
                                aria-label={`Verwijder ${file.name}`}
                            >
                                <IconX className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* File error message */}
            {fileError && (
                <div className="px-3 pt-1 text-red-600 text-xs">{fileError}</div>
            )}

            {/* Input bar */}
            <div className="px-2 flex items-center gap-2">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_STRING}
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                />
                <button
                    className="px-1 py-1 text-[#154273] hover:text-[#03689B] transition-colors disabled:opacity-40"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={totalAttachedCount >= MAX_FILES}
                    aria-label="Bestand bijvoegen"
                    title="Bestand bijvoegen"
                >
                    <IconPaperclip className="h-5 w-5" />
                </button>
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
                <IconMicrophone className="inline-block" />
                <button className="px-3 py-1" onClick={submitContent} aria-label="Send">
                    <IconSend2 />
                </button>
            </div>
        </div>
    );
};

export default Chat;
