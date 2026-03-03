import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import useChat from "../hooks/useChat";
import TypewriterStreaming from "./ui/typewriter-streaming.tsx";
import { IconPaperclip, IconSend2, IconX, IconLoader2 } from "@tabler/icons-react";
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
    const accessToken = searchParams.get("accessToken");
    const [content, setContent] = useState<string>("");
    const [fileError, setFileError] = useState<string>("");
    const [uploading, setUploading] = useState<boolean>(false);
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

            requestForm.setQuestions(prev => {
                const existingTexts = new Set(prev.map(q => q.question));
                const uniqueNewQuestions = newQuestionObjects.filter(
                    (q: any) => !existingTexts.has(q.question)
                );
                if (uniqueNewQuestions.length === 0) return prev;
                return [...prev, ...uniqueNewQuestions];
            });
        }
    };

    const {
        messages,
        animatedText,
        sendMessage,
        currentMessageKey,
        uploadedDocuments: chatUploadedDocuments,
        removeDocument: chatRemoveDocument,
        uploadDocuments,
    } = useChat(accessToken, functionCaller, "Hello, how can I help you?", initialMessages);

    // Sync newly uploaded documents from useChat into the shared context
    // We track previous length to only push new additions (avoiding overwriting context removals)
    const prevChatDocsLengthRef = useRef(chatUploadedDocuments.length);
    useEffect(() => {
        if (requestForm && chatUploadedDocuments.length > prevChatDocsLengthRef.current) {
            // New documents were added in useChat — merge them into context
            const newDocs = chatUploadedDocuments.slice(prevChatDocsLengthRef.current);
            requestForm.setUploadedDocuments(prev => {
                const existingKeys = new Set(prev.map(d => d.s3_key));
                const toAdd = newDocs.filter(d => !existingKeys.has(d.s3_key));
                return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
            });
        }
        prevChatDocsLengthRef.current = chatUploadedDocuments.length;
    }, [chatUploadedDocuments]);

    // Use context documents for display (shared with RequestForm)
    const contextDocuments = requestForm?.uploadedDocuments ?? chatUploadedDocuments;

    // Remove from both useChat internal state and context
    const handleRemoveDocument = useCallback(async (s3Key: string) => {
        // Remove from context (which also calls the backend DELETE)
        if (requestForm) {
            await requestForm.removeUploadedDocument(s3Key);
        } else {
            await chatRemoveDocument(s3Key);
        }
    }, [chatRemoveDocument, requestForm]);

    useEffect(() => {
        if (bottomOfChatContainer.current) {
            bottomOfChatContainer.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, animatedText]);

    // --- File handling - upload immediately on selection ---
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError("");
        const selected = Array.from(e.target.files || []);
        if (selected.length === 0) return;

        // Check total count
        if (contextDocuments.length + selected.length > MAX_FILES) {
            setFileError(`U kunt maximaal ${MAX_FILES} documenten bijvoegen.`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        // Validate each file
        for (const file of selected) {
            const ext = file.name.split(".").pop()?.toLowerCase() || "";
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

        // Upload files immediately to the server
        setUploading(true);
        try {
            await uploadDocuments(selected);
        } catch (err) {
            setFileError(err instanceof Error ? err.message : 'Bestand uploaden mislukt');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [contextDocuments.length, uploadDocuments]);

    const submitContent = () => {
        if (!content.trim()) return;
        sendMessage(content);
        setContent("");
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
            {contextDocuments.length > 0 && (
                <div className="px-3 pt-2 flex flex-wrap gap-2">
                    {contextDocuments.map((doc) => (
                        <span
                            key={doc.s3_key}
                            className="inline-flex items-center gap-1 bg-[#03689B]/10 text-[#154273] text-xs px-2 py-1 rounded-full"
                        >
                            {doc.filename}
                            <button
                                onClick={() => handleRemoveDocument(doc.s3_key)}
                                className="hover:text-red-600 transition-colors"
                                aria-label={`Verwijder ${doc.filename}`}
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
                    disabled={contextDocuments.length >= MAX_FILES || uploading}
                    aria-label="Bestand bijvoegen"
                    title="Bestand bijvoegen"
                >
                    {uploading ? (
                        <IconLoader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <IconPaperclip className="h-5 w-5" />
                    )}
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
                <button className="px-3 py-1" onClick={submitContent} aria-label="Send">
                    <IconSend2 className="stroke-[#03689B]" />
                </button>
            </div>
        </div>
    );
};

export default Chat;
