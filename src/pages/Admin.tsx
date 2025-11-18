import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { IconLoader2 } from "@tabler/icons-react";
import type { Question, Answer } from "../context/RequestFormContext";
import SEO from "../components/SEO";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";

interface SearchResult {
    chunks: Array<{
        id: string;
        content: {
            id?: string;
            content?: {
                chunk_text?: string;
                url?: string;
            };
            document?: {
                title?: string;
                url?: string;
            };
        };
    }>;
    query: string;
    count: number;
}

const Admin = () => {
    const [searchParams] = useSearchParams();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [includePrivate, setIncludePrivate] = useState(false);
    const chatId = searchParams.get("chatId");
    
    useEffect(() => {
        const fetchConversation = async () => {
            setLoading(true);
            
            try {
                let response;
                if (chatId && !isNaN(parseInt(chatId))) {
                    response = await fetch(`${BACKEND_URL}/api/conversations/${chatId}/`);
                } else {
                    console.error('No valid chatId provided');
                    setLoading(false);
                    return;
                }
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Data", data);
                    
                    // Handle different response structures
                    const questionsData = data.woo_request?.questions || data.questions || [];
                    setQuestions(
                        questionsData.map((q: any) => ({
                            ...q,
                            answer: q.answer ? q.answer : undefined,
                            answer_loading: !q.answer,
                            saved: true
                        }))
                    );
                } else {
                    console.error('Failed to fetch conversation');
                }
            } catch (error) {
                console.error('Error fetching conversation:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchConversation();
    }, [searchParams, chatId]);

    // Helper function to get chunk URL by chunk_id (inspired by AnswerViewer)
    const getChunkUrl = (chunkId: string, answer: Answer): string | undefined => {
        const chunk = answer.chunks?.find(chunk => chunk.id === chunkId);
        return chunk?.content?.content?.url;
    };

    // Render information text with potential highlighting
    const renderInformationText = (answer: Answer) => {
        // Simple text display - can be enhanced with highlighting logic if needed
        return answer.answer;
    };

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/search/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: query,
                    include_private: includePrivate,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            } else {
                console.error("Search failed:", await response.text());
                setSearchResults(null);
            }
        } catch (error) {
            console.error("Error performing search:", error);
            setSearchResults(null);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            performSearch(searchQuery);
        }
    };

    const handleAction = (action: string, questionId: number) => {
        if (action === "Zoeken") {
            const question = questions.find((q) => q.id === questionId);
            if (question) {
                setSearchQuery(question.question);
                performSearch(question.question);
            }
        } else {
            console.log(`${action} clicked for question ${questionId}`);
            // Functionality will be implemented later
        }
    };

    const handleGeneralAction = (action: string) => {
        console.log(`${action} clicked`);
        // Functionality will be implemented later
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-[#154273]">
                        <IconLoader2 className="animate-spin h-6 w-6" />
                        <span>Laden...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <SEO
                title="BurgerVerzoek - Admin Portaal"
                description="Admin portaal voor het beheren van burgerverzoeken. Goedgekeurde vragen en antwoorden, zoeken in niet-publieke informatie, en verzoeken versturen naar burgers of doorzetten naar andere overheidsorganen."
                keywords="admin portaal, burgerverzoek beheren, WOO verzoek beheren, ambtenaar, overheidsorgaan"
                ogTitle="BurgerVerzoek - Admin Portaal"
                ogDescription="Admin portaal voor het beheren van burgerverzoeken met praktische takenlijst."
                ogUrl="/admin"
                canonicalUrl="/admin"
            />
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Two-column layout */}
                <div className="grid grid-cols-2 gap-8">
                    {/* Left Column - Current Content */}
                    <div className="w-full">
                        {/* Header Section */}
                        <div className="mb-6">
                            <h1 className="text-4xl font-bold text-black mb-2">BurgerVerzoek</h1>
                            <p className="text-base text-gray-700">
                                Dit is een binnengekomen informatieverzoek van een burger.
                            </p>
                        </div>

                        {/* Main Request Statement Box */}
                        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6 mb-6">
                            <div className="text-sm text-gray-800 space-y-2">
                                <p><strong>Onderwerp:</strong> Informatie verzoek</p>
                                <p>Geachte Heer/Mevrouw,</p>
                                <p>
                                    Via deze mail doe ik het verzoek op grond van de Wet Open Overheid. 
                                    Ik verzoek openbaring van de volgende informatie:
                                </p>
                            </div>
                        </div>

                        {/* Questions Sections */}
                        {questions.length === 0 ? (
                            <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6 mb-6 text-center text-gray-600">
                                Geen vragen gevonden.
                            </div>
                        ) : (
                            questions.map((question, index) => (
                                <div key={question.id} className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6 mb-6">
                                    <div className="mb-4">
                                        <h3 className="text-base font-semibold text-gray-900 mb-3">
                                            Vraag {index + 1}: {question.question}
                                        </h3>
                                        {question.answer_loading ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-800">
                                                <IconLoader2 className="animate-spin h-4 w-4" />
                                                <span>Antwoord wordt geladen...</span>
                                            </div>
                                        ) : question.answer ? (
                                            <div className="text-sm text-gray-800">
                                                <p>
                                                    Informatie {index + 1}: {renderInformationText(question.answer)}
                                                </p>
                                                {/* Show source links if available (inspired by AnswerViewer) */}
                                                {question.answer.details?.blocks && question.answer.details.blocks.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        {question.answer.details.blocks.map((block, blockIndex) => {
                                                            const url = getChunkUrl(block.chunk_id, question.answer!);
                                                            return (
                                                                <div key={blockIndex} className="text-xs text-gray-600 border-l-2 border-[#03689B] pl-2">
                                                                    <div className="italic mb-1">"{block.quote}"</div>
                                                                    {url && (
                                                                        <a 
                                                                            href={url} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="text-[#03689B] hover:underline"
                                                                        >
                                                                            Bron →
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 italic">
                                                Geen antwoord beschikbaar
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex flex-row gap-[8px] justify-end">
                                        <button
                                            onClick={() => handleAction("Accepteer", question.id)}
                                            className="bg-[#03689B] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#025a87] transition-colors"
                                        >
                                            Accepteer
                                        </button>
                                        <button
                                            onClick={() => handleAction("Weiger", question.id)}
                                            className="bg-[#03689B] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#025a87] transition-colors"
                                        >
                                            Weiger
                                        </button>
                                        <button
                                            onClick={() => handleAction("Navraag", question.id)}
                                            className="bg-[#03689B] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#025a87] transition-colors"
                                        >
                                            Navraag
                                        </button>
                                        <button
                                            onClick={() => handleAction("Zoeken", question.id)}
                                            className="bg-[#03689B] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#025a87] transition-colors"
                                        >
                                            Zoeken
                                        </button>
                                        <button
                                            onClick={() => handleAction("Pas aan", question.id)}
                                            className="bg-[#03689B] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#025a87] transition-colors"
                                        >
                                            Pas aan
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* General Action Buttons */}
                        <div className="flex flex-wrap gap-4 mt-8">
                            <button
                                onClick={() => handleGeneralAction("Verstuur als mail")}
                                className="bg-[#F68153] text-white px-6 py-3 rounded text-sm font-medium hover:bg-[#e67042] transition-colors"
                            >
                                Verstuur als mail
                            </button>
                            <button
                                onClick={() => handleGeneralAction("Download als .pdf")}
                                className="bg-[#F68153] text-white px-6 py-3 rounded text-sm font-medium hover:bg-[#e67042] transition-colors"
                            >
                                Download als .pdf
                            </button>
                            <button
                                onClick={() => handleGeneralAction("Stuur door")}
                                className="bg-[#F68153] text-white px-6 py-3 rounded text-sm font-medium hover:bg-[#e67042] transition-colors"
                            >
                                Stuur door
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Search Results */}
                    <div className="w-full">
                        <div className="rounded-lg flex flex-col bg-[#EFF7FC] border-2 border-[#03689B] min-h-[400px]">
                            <div className="p-4 border-b border-[#03689B]">
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        className="flex-1 bg-transparent text-[#154273] text-lg outline-none placeholder:text-[#154273]/60 border border-[#03689B] rounded px-3 py-2"
                                        type="text"
                                        placeholder="Document Zoeken..."
                                        value={searchQuery}
                                        onChange={handleSearchInputChange}
                                        onKeyPress={handleSearchInputKeyPress}
                                    />
                                    <button
                                        onClick={() => performSearch(searchQuery)}
                                        className="bg-[#03689B] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#025a87] transition-colors"
                                        disabled={searchLoading}
                                    >
                                        {searchLoading ? (
                                            <IconLoader2 className="animate-spin h-4 w-4" />
                                        ) : (
                                            "Zoek"
                                        )}
                                    </button>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-[#154273]">
                                    <input
                                        type="checkbox"
                                        checked={includePrivate}
                                        onChange={(e) => setIncludePrivate(e.target.checked)}
                                        className="rounded"
                                    />
                                    <span>Inclusief private databases</span>
                                </label>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {searchLoading ? (
                                    <div className="flex items-center justify-center gap-2 text-[#154273] py-8">
                                        <IconLoader2 className="animate-spin h-6 w-6" />
                                        <span>Zoeken...</span>
                                    </div>
                                ) : searchResults ? (
                                    <div className="space-y-4">
                                        <div className="text-sm text-[#154273] font-semibold mb-2">
                                            {searchResults.count} resultaten gevonden voor "{searchResults.query}"
                                        </div>
                                        {searchResults.chunks.length === 0 ? (
                                            <div className="text-sm text-gray-600 italic text-center py-8">
                                                Geen resultaten gevonden.
                                            </div>
                                        ) : (
                                            searchResults.chunks.map((chunk) => {
                                                const chunkText = chunk.content?.content?.chunk_text || "";
                                                const chunkUrl = chunk.content?.content?.url || chunk.content?.document?.url;
                                                const documentTitle = chunk.content?.document?.title || "Document";
                                                
                                                return (
                                                    <div
                                                        key={chunk.id}
                                                        className="bg-white border border-[#03689B] rounded-lg p-4 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="text-xs text-[#154273] font-semibold mb-2">
                                                            {documentTitle}
                                                        </div>
                                                        <div className="text-sm text-gray-700 mb-2 line-clamp-3">
                                                            {chunkText || "Geen tekst beschikbaar"}
                                                        </div>
                                                        {chunkUrl && (
                                                            <a
                                                                href={chunkUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-[#03689B] hover:underline"
                                                            >
                                                                Bron bekijken →
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-[#154273]/60 text-center py-8">
                                        Voer een zoekopdracht in om documenten te vinden.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;