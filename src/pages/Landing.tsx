import { useState, useRef, useEffect, useCallback, useContext } from "react";
import { IconSend2, IconLoader2, IconPaperclip, IconX } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useChatContext } from "../context/ChatContext";
import { RequestFormContext } from "../context/RequestFormContext";

const ALLOWED_EXTENSIONS = [
    "pdf", "csv", "jsonl", "xml", "txt", "json",
    "md", "html", "docx", "xlsx", "tsv",
    "yaml", "yml", "log",
];
const ACCEPT_STRING = ALLOWED_EXTENSIONS.map(e => `.${e}`).join(",");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 2;

const Landing = () => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [fileError, setFileError] = useState<string>("");
    const [uploading, setUploading] = useState<boolean>(false);

    const chatContext = useChatContext();
    const requestForm = useContext(RequestFormContext);

    // Reset both contexts on mount so we start with a clean slate
    // (handles back-navigation from /request where old state would linger)
    useEffect(() => {
        chatContext.resetConversation();
        requestForm?.reset();
    }, []);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    // Upload a file immediately when selected
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError("");
        const selected = Array.from(e.target.files || []);
        if (selected.length === 0) return;

        if (chatContext.uploadedDocuments.length + selected.length > MAX_FILES) {
            setFileError(`U kunt maximaal ${MAX_FILES} documenten bijvoegen.`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

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

        // Upload each file immediately via ChatContext
        setUploading(true);
        try {
            await chatContext.uploadDocuments(selected);
        } catch (err) {
            setFileError(err instanceof Error ? err.message : 'Bestand uploaden mislukt');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [chatContext]);

    const removeDocument = useCallback(async (s3Key: string) => {
        await chatContext.removeDocument(s3Key);
    }, [chatContext]);

    const submitContent = async () => {
        if (!content.trim()) return;
        setLoading(true);
        try {
            // sendMessage updates chatContext.accessToken, but since it's async
            // and state updates are batched, we need to watch for the token change.
            await chatContext.sendMessage(content);
        } catch (error) {
            console.error('Error submitting content:', error);
            setLoading(false);
        }
        // Navigation will be handled by the effect below once accessToken is set
    };

    // Navigate to /request once accessToken is set (after sendMessage completes)
    const hasNavigatedRef = useRef(false);
    useEffect(() => {
        if (chatContext.accessToken && loading && !hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            setLoading(false);
            navigate(`/request?accessToken=${chatContext.accessToken}`);
        }
    }, [chatContext.accessToken, loading, navigate]);

    // Reset navigation guard when landing page mounts fresh
    useEffect(() => {
        hasNavigatedRef.current = false;
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <SEO
                title="VraagMijnOverheid - Stel uw vraag aan de overheid"
                description="Wil u iets weten van de overheid? Stel uw vraag hier op een eenvoudige en respectvolle manier. Wij helpen u vanaf de eerste vraag met het vinden van informatie en het indienen van WOO-verzoeken. Transparantie en vertrouwen tussen burger en overheid."
                keywords="WOO verzoek, Wet Open Overheid, informatieverzoek, overheid, transparantie, burger, overheidsinformatie, open overheid, VraagMijnOverheid, burger en overheid"
                ogTitle="VraagMijnOverheid - Transparantie en vertrouwen tussen burger en overheid"
                ogDescription="Stel uw vraag aan de overheid op een eenvoudige en respectvolle manier. Wij helpen u vanaf de eerste vraag met het vinden van informatie."
                ogUrl="/"
                canonicalUrl="/"
            />
            <div className="w-full flex flex-col justify-center">
            <Navbar />
            <div>
            <div>
                
            </div>
            </div>

            <div className="w-full md:w-1/3 self-center px-4 md:px-0">
            <div className="text-2xl font-bold pt-22 pb-4">VraagMijnOverheid</div>
            <div className="pb-6 px-2">
                <div>
                    <p className="pb-2">Welkom bij VraagMijnOverheid van het Ministerie van Justitie.</p> 

                    Op dit platform helpen we je om Wet Open Overheid (Woo) verzoeken op te stellen, zodat wij precies weten wat je zoekt en je dus het snelst kunnen helpen. 
                    Nadat je een eerste vraag hebt gesteld, kunnen we je helpen. Er opent zich dan een nieuw venster, waarin we laten zien hoe we je eerste vraag begrepen hebben. 
                </div>
            </div>
            <div className="px-0 md:px-2">
            <div className="rounded-lg flex flex-col bg-[#EFF7FC] border-2 border-[#03689B]">
            <div className="overflow-y-auto p-2 md:p-8">
            </div>

            {/* Attached documents chips */}
            {chatContext.uploadedDocuments.length > 0 && (
                <div className="px-3 pt-2 flex flex-wrap gap-2">
                    {chatContext.uploadedDocuments.map((doc) => (
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
                </div>
            )}

            {/* File error message */}
            {fileError && (
                <div className="px-3 pt-1 text-red-600 text-xs">{fileError}</div>
            )}

            <div className="px-2 md:px-2 flex items-start gap-1 md:gap-2">
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
                    className="px-1 py-4 flex-shrink-0 self-end text-[#154273] hover:text-[#03689B] transition-colors disabled:opacity-40"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={chatContext.uploadedDocuments.length >= MAX_FILES || loading || uploading}
                    aria-label="Bestand bijvoegen"
                    title="Bestand bijvoegen"
                >
                    {uploading ? (
                        <IconLoader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <IconPaperclip className="w-5 h-5" />
                    )}
                </button>
                <textarea
                    ref={textareaRef}
                    className="flex-1 self-end bg-transparent text-[#154273] m-2 mb-3.5 text-base outline-none placeholder:text-[#154273]/60 border-0 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-hidden leading-normal"
                    style={{ height: "auto" }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Hoe kunnen we je helpen? Stel hier je vraag."
                    disabled={loading}
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !loading) {
                            e.preventDefault();
                            submitContent();
                        }
                    }}
                />
                <button 
                    className="px-1 py-3 flex-shrink-0 self-end disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={submitContent} 
                    disabled={loading}
                    aria-label="Send"
                >
                    {loading ? (
                        <IconLoader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                    ) : (
                        <IconSend2 className="w-5 h-5 md:w-6 md:h-6 stroke-[#03689B]" />
                    )}
                </button>
            </div>
        </div>
            </div>
            <div className="text-sm font-bold text-[#154475] pt-6 px-2">
                {'>'} Worstelt u met het stellen van uw vraag? 
                Kijk deze video die je op weg helpt. 
            </div>
            </div>
        </div>
        <Footer />
    </div>
    )
}

export default Landing;
