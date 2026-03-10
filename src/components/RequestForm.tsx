import { useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconChevronDown, IconDownload, IconPaperclip, IconX } from '@tabler/icons-react';
import { RequestFormContext } from '../context/RequestFormContext';
import type { Answer } from '../context/RequestFormContext';
import StatusBar from './ui/status-bar';
import PDFModal from './PDFModal';
import EmailModal from './EmailModal';
import WooSubmitModal from './WooSubmitModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import { getCSRFHeaders } from '../hooks/authentication_helper';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";

const markdownComponents = {
    table: (props: React.HTMLAttributes<HTMLTableElement>) => (
        <div className="overflow-x-auto my-2">
            <table className="w-full border-collapse text-xs table-fixed" {...props} />
        </div>
    ),
    thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <thead className="bg-gray-100" {...props} />
    ),
    th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
        <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-[#154273] break-words" {...props} />
    ),
    td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
        <td className="border border-gray-300 px-2 py-1 break-words" {...props} />
    ),
    tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
        <tr className="even:bg-gray-50" {...props} />
    ),
};


const EvidenceQuote = ({ quote, formattedQuote }: { quote: string; formattedQuote?: string }) => {
    const [activeTab, setActiveTab] = useState<'formatted' | 'direct'>(formattedQuote ? 'formatted' : 'direct');

    if (!formattedQuote) {
        return (
            <div className="italic text-gray-700 mb-2 prose prose-sm max-w-none overflow-hidden break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{`"${quote}"`}</ReactMarkdown>
            </div>
        );
    }

    return (
        <div className="mb-2 overflow-hidden">
            <div className="flex gap-1 mb-2">
                <button
                    onClick={() => setActiveTab('formatted')}
                    className={`text-[10px] px-2 py-0.5 rounded-t border border-b-0 transition-colors ${
                        activeTab === 'formatted'
                            ? 'bg-white text-[#154273] border-[#F68153] font-medium'
                            : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                    Opgemaakt citaat
                </button>
                <button
                    onClick={() => setActiveTab('direct')}
                    className={`text-[10px] px-2 py-0.5 rounded-t border border-b-0 transition-colors ${
                        activeTab === 'direct'
                            ? 'bg-white text-[#154273] border-[#F68153] font-medium'
                            : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                    Direct citaat
                </button>
            </div>
            <div className="italic text-gray-700 prose prose-sm max-w-none overflow-x-auto break-words">
                {activeTab === 'formatted' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{formattedQuote}</ReactMarkdown>
                ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{`"${quote}"`}</ReactMarkdown>
                )}
            </div>
        </div>
    );
};


const AnswerViewer = ({ answer, documentNames }: { answer: Answer; documentNames: Record<string, string> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pdfModal, setPdfModal] = useState<{
        isOpen: boolean;
        pdfUrl: string;
        pageNumber: number;
        documentName: string;
    }>({ isOpen: false, pdfUrl: '', pageNumber: 0, documentName: '' });

    // Find chunk URL by chunk_id (legacy fallback)
    const getChunkUrl = (chunkId: string): string | undefined => {
        const chunk = answer.chunks?.find(chunk => chunk.id === chunkId);
        return chunk?.content?.content?.url;
    };

    const openPdfModal = useCallback(async (documentId: string, pageNumber: number) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/documents/${documentId}/presigned-url/`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch presigned URL');
            const data = await res.json();
            setPdfModal({
                isOpen: true,
                pdfUrl: data.url,
                pageNumber,
                documentName: data.name || 'Document',
            });
        } catch (err) {
            console.error('Failed to open PDF:', err);
        }
    }, []);

    const closePdfModal = useCallback(() => {
        setPdfModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Get dot color based on answered status
    const getDotColor = () => {
        switch (answer.answered) {
            case "yes":
                return "bg-green-500";
            case "partial":
                return "bg-yellow-500";
            case "no":
                return "bg-red-500";
            default:
                return "bg-gray-400";
        }
    };

    // Show Dutch text if not answered
    const displayText = answer.answered === "no" 
        ? "Niet beantwoord" 
        : answer.answer;

    return (
        <div className="w-full relative">
            <div className="flex items-center gap-2 w-full">
                <div className={`flex-shrink-0 w-3 h-3 rounded-full ${getDotColor()}`}></div>
                <div className="text-sm text-[#154273] truncate flex-1">{displayText}</div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-shrink-0 w-6 h-6 rounded-full border border-[#F68153] flex items-center justify-center hover:bg-[#F68153]/10 transition-colors"
                    aria-label="Toggle answer details"
                >
                    <IconChevronDown 
                        className={`h-3 w-3 text-[#F68153] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>
            {isOpen && (
                <div className="relative z-[9999] mt-2 p-3 bg-white border border-[#F68153] rounded text-sm text-[#154273] shadow-lg overflow-hidden">
                    <div className="mb-3 prose prose-sm max-w-none break-words overflow-x-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{answer.answered === "no" ? "Niet beantwoord" : answer.answer}</ReactMarkdown>
                    </div>
                    {answer.details?.blocks && answer.details.blocks.length > 0 && (
                        <div className="mt-4 space-y-3">
                            {answer.details.blocks.map((block, index) => {
                                if (block.type === 'text' && block.content) {
                                    return (
                                        <div key={index} className="text-xs text-gray-700">
                                            {block.content}
                                        </div>
                                    );
                                }

                                if (block.type === 'evidence' && block.quote) {
                                    const hasDocument = block.document_id && block.page_number !== undefined;
                                    const docName = block.document_id ? documentNames[block.document_id] : undefined;
                                    return (
                                        <div key={index} className="border-l-2 border-[#F68153] pl-3 py-2 overflow-hidden">
                                            {block.no_validated_quote ? (
                                                <div className="text-gray-500 text-sm italic mb-2">
                                                    Geen directe citaat beschikbaar — zie het brondocument voor relevante informatie.
                                                </div>
                                            ) : (
                                                <EvidenceQuote quote={block.quote} formattedQuote={block.formatted_quote} />
                                            )}
                                            {hasDocument ? (
                                                <button
                                                    onClick={() => openPdfModal(block.document_id!, block.page_number!)}
                                                    className="text-[#03689B] hover:underline text-xs cursor-pointer bg-transparent border-none p-0 max-w-full text-left"
                                                    title={docName || 'Bekijk bron (PDF)'}
                                                >
                                                    <span className="inline-block max-w-[250px] truncate align-bottom">
                                                        {docName || 'Bekijk bron (PDF)'}
                                                    </span>
                                                    {docName && <span className="whitespace-nowrap"> (p. {block.page_number! + 1})</span>}
                                                    <span> →</span>
                                                </button>
                                            ) : (
                                                (() => {
                                                    const url = block.chunk_id ? getChunkUrl(block.chunk_id) : undefined;
                                                    return url ? (
                                                        <a 
                                                            href={url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-[#03689B] hover:underline text-xs"
                                                        >
                                                            Bekijk bron →
                                                        </a>
                                                    ) : null;
                                                })()
                                            )}
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* PDF Viewer Modal */}
            <PDFModal
                isOpen={pdfModal.isOpen}
                onClose={closePdfModal}
                pdfUrl={pdfModal.pdfUrl}
                pageNumber={pdfModal.pageNumber}
                documentName={pdfModal.documentName}
            />
        </div>
    );
};

const RequestForm = ({ finalize = false }: { finalize?: boolean }) => {
    const requestForm = useContext(RequestFormContext);
    const uploadedDocuments = requestForm?.uploadedDocuments ?? [];
    const onRemoveDocument = requestForm?.removeUploadedDocument;
    const [submitting, setSubmitting] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [submitModal, setSubmitModal] = useState<{
        isOpen: boolean;
        type: 'informatieverzoek' | 'woo_verzoek';
    }>({ isOpen: false, type: 'informatieverzoek' });

    // Build document name map directly from enriched answer blocks (no API calls)
    const documentNames = useMemo<Record<string, string>>(() => {
        if (!requestForm) return {};
        const names: Record<string, string> = {};
        requestForm.questions.forEach((question) => {
            question.answer?.details?.blocks?.forEach((block) => {
                if (block.document_id && block.document_name && !names[block.document_id]) {
                    names[block.document_id] = block.document_name;
                }
            });
        });
        return names;
    }, [requestForm?.questions]);

    const handleDownloadDocument = useCallback(async (documentId: string, documentName: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/documents/${documentId}/presigned-url/`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch presigned URL');
            const data = await res.json();
            const fileName = data.name || documentName || 'document.pdf';
            const fileRes = await fetch(data.url);
            if (!fileRes.ok) throw new Error('Failed to download file');
            const blob = await fileRes.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download document:', err);
            toast.error('Fout bij downloaden van document');
        }
    }, []);

    // Build appendix data grouped by document, with page references underneath
    const appendixByDocument = useMemo(() => {
        if (!requestForm) return [];
        const docMap = new Map<string, { pages: Set<number>; original_url?: string }>();

        requestForm.questions.forEach((question) => {
            if (question.answer?.details?.blocks) {
                question.answer.details.blocks.forEach((block) => {
                    if (block.type === 'evidence' && block.document_id && block.page_number !== undefined) {
                        if (!docMap.has(block.document_id)) {
                            docMap.set(block.document_id, { pages: new Set(), original_url: block.original_url });
                        }
                        const entry = docMap.get(block.document_id)!;
                        entry.pages.add(block.page_number);
                        if (!entry.original_url && block.original_url) {
                            entry.original_url = block.original_url;
                        }
                    }
                });
            }
        });

        return Array.from(docMap.entries()).map(([docId, data]) => ({
            document_id: docId,
            pages: Array.from(data.pages).sort((a, b) => a - b),
            original_url: data.original_url,
        }));
    }, [requestForm?.questions]);

    if (!requestForm) return null;
    
    const accessToken = searchParams.get("accessToken");

    const handleSubmit = async () => {
        if (finalize) {
            setSubmitting(true);
            try {
                const response = await fetch(`${BACKEND_URL}/api/finalize/`, {
                    method: 'POST',
                    headers: getCSRFHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ access_token: accessToken }),
                    credentials: 'include'
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to finalize request' }));
                    throw new Error(errorData.error || 'Failed to finalize request');
                }
                navigate(`/completed-request?accessToken=${accessToken}`);
            } catch (error) {
                console.error('Error finalizing request:', error);
                alert(error instanceof Error ? error.message : 'Failed to finalize request');
            } finally {
                setSubmitting(false);
            }
        } else {
            navigate(`/finalize?accessToken=${accessToken}`);
        }
    };

    const handleSendPdf = async (email: string) => {
        if (!accessToken) {
            throw new Error('Access token niet gevonden');
        }

        const response = await fetch(`${BACKEND_URL}/api/send-woo-request-pdf/`, {
            method: 'POST',
            headers: getCSRFHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ 
                access_token: accessToken,
                email: email 
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Fout bij verzenden' }));
            throw new Error(errorData.error || 'Fout bij verzenden van PDF');
        }

        await response.json();
        toast.success('PDF succesvol verzonden naar uw e-mailadres!', {
            position: "top-right",
            autoClose: 3000,
        });
    };

    const handleDownloadPdf = async () => {
        if (!accessToken) {
            toast.error('Access token niet gevonden');
            return;
        }
        try {
            const response = await fetch(`${BACKEND_URL}/api/woo-requests/${accessToken}/download-pdf/`, { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Fout bij downloaden van PDF');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `WOO_rapport.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Fout bij downloaden van PDF');
        }
    };

    console.log("Request form questions", requestForm.questions);
    return (
        <div className={`${finalize ? 'flex flex-col md:flex-row md:items-start gap-6' : 'flex flex-col'}`}>
            <div className={`${finalize ? 'w-full md:w-1/2' : 'max-h-[70vh]'} flex flex-col`}>
                <div className={`p-6 md:p-8 flex-1 overflow-y-auto bg-[#F5F5F5] border-2 border-[#738DA7] mb-6`}>
                    <div className="text-sm py-2">
                        <p className="text-sm py-2">Onderwerp: Informatie verzoek </p>

                        <p className="text-sm py-2">Geachte Heer/Mevrouw, </p>

                        <p className="text-sm py-2">Via deze mail doe ik het verzoek op grond van de Wet Open Overheid. Ik verzoek openbaring van de volgende informatie:</p>
                    </div>
                    {requestForm.questions.map((question) => (
                        <div key={question.question} className="mb-4">
                            <label className="block text-sm font-medium text-[#154273] mb-2">{question.question}</label>
                            {question.answer_loading ? (
                                <div className="py-2">
                                    <StatusBar size="sm" progress={question.progress} />
                                </div>
                            ) : question.answer_failed ? (
                                <div className="flex items-center gap-2 py-2">
                                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm text-red-600">Beantwoording mislukt</span>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await fetch(`${BACKEND_URL}/api/woo-questions/${question.id}/retry/`, {
                                                    method: 'POST',
                                                    headers: getCSRFHeaders({ 'Content-Type': 'application/json' }),
                                                    credentials: 'include',
                                                });
                                                if (!res.ok) {
                                                    const err = await res.json().catch(() => ({}));
                                                    throw new Error(err.error || 'Retry mislukt');
                                                }
                                                // Reset the question to loading state
                                                requestForm.setQuestions((prev) =>
                                                    prev.map((q) =>
                                                        q.id === question.id
                                                            ? { ...q, answer_loading: true, answer_failed: false, error_message: '', progress: undefined }
                                                            : q
                                                    )
                                                );
                                            } catch (err) {
                                                console.error('Retry failed:', err);
                                                toast.error(err instanceof Error ? err.message : 'Retry mislukt');
                                            }
                                        }}
                                        className="text-xs text-[#03689B] hover:underline ml-2"
                                    >
                                        Opnieuw proberen
                                    </button>
                                </div>
                            ) : question.answer ? (
                                <AnswerViewer answer={question.answer} documentNames={documentNames} />
                            ) : null}
                        </div>
                    ))}
                    <div className="text-sm py-2">
                        <p>Met vriendelijke groet,</p>
                        <p>[Jouw naam]</p>
                    </div>
                    
                    {/* Uploaded documents section */}
                    {uploadedDocuments.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-[#738DA7]">
                            <h3 className="text-sm font-semibold text-[#154273] mb-2">Bijgevoegde documenten</h3>
                            <p className="text-xs text-gray-600 mb-2">
                                De volgende documenten zijn door u bijgevoegd bij dit verzoek.
                            </p>
                            <ul className="space-y-1">
                                {uploadedDocuments.map((doc) => (
                                    <li key={doc.s3_key} className="flex items-center gap-2 text-sm text-[#154273]">
                                        <IconPaperclip className="h-3.5 w-3.5 text-[#03689B] flex-shrink-0" />
                                        <span className="truncate flex-1">{doc.filename}</span>
                                        {onRemoveDocument && (
                                            <button
                                                onClick={() => onRemoveDocument(doc.s3_key)}
                                                className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                                                aria-label={`Verwijder ${doc.filename}`}
                                                title="Verwijder document"
                                            >
                                                <IconX className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Appendix section */}
                    {appendixByDocument.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-[#738DA7]">
                            <h3 className="text-sm font-semibold text-[#154273] mb-4">Bijlagen - Referentiedocumenten</h3>
                            <p className="text-xs text-gray-600 mb-3">
                                De volgende documenten worden in de antwoorden genoemd. Klik op een pagina om het te bekijken.
                            </p>
                            <table className="w-full text-sm border-collapse table-fixed">
                                <colgroup>
                                    <col className="w-[30px]" />
                                    <col />
                                    <col className="w-[120px]" />
                                    <col className="w-[100px]" />
                                    <col className="w-[70px]" />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-[#738DA7]">
                                        <th className="text-left py-2 pr-2 text-[#154273] font-semibold">#</th>
                                        <th className="text-left py-2 pr-3 text-[#154273] font-semibold">Document</th>
                                        <th className="text-left py-2 pr-3 text-[#154273] font-semibold">Pagina's</th>
                                        <th className="text-center py-2 pr-3 text-[#154273] font-semibold">Openbarheid</th>
                                        <th className="text-center py-2 text-[#154273] font-semibold">Download</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appendixByDocument.map((doc, idx) => {
                                        const displayName = documentNames[doc.document_id] || `Document ${doc.document_id.slice(0, 8)}…`;
                                        return (
                                            <tr key={doc.document_id} className="border-b border-gray-200">
                                                <td className="py-2 pr-2 text-[#154273] font-medium align-top">{idx + 1}.</td>
                                                <td className="py-2 pr-3 align-top overflow-hidden">
                                                    <a
                                                        href={`/document?documentId=${doc.document_id}&page=0`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#03689B] hover:underline block text-sm break-words overflow-wrap-anywhere"
                                                        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                                                        title={`Bekijk ${displayName}`}
                                                    >
                                                        {displayName}
                                                    </a>
                                                </td>
                                                <td className="py-2 pr-3 align-top">
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.pages.map((page) => (
                                                            <a
                                                                key={page}
                                                                href={`/document?documentId=${doc.document_id}&page=${page}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[#03689B] hover:underline text-xs px-1.5 py-0.5 bg-[#EFF7FC] rounded"
                                                            >
                                                                p. {page + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-2 pr-3 align-top text-center">
                                                    {doc.original_url ? (
                                                        <a
                                                            href={doc.original_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[#03689B] hover:underline text-xs"
                                                            title="Bekijk op Open Overheid"
                                                        >
                                                            Bekijk →
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="py-2 align-top text-center">
                                                    <button
                                                        onClick={() => handleDownloadDocument(doc.document_id, displayName)}
                                                        className="text-[#03689B] hover:text-[#154273] transition-colors bg-transparent border-none p-1 cursor-pointer"
                                                        title={`Download ${displayName}`}
                                                    >
                                                        <IconDownload className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            { finalize ? (
                <>
                {/* {!emailSubmitted ? <div>
                    <p>Voer je mailadres in</p>
                    <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="text-sm display-inline-block rounded-sm bg-[#EFF7FC] border-2 border-[#03689B] h-8 px-2" />
                    <button onClick={() => setEmailSubmitted(true)} className="text-sm ml-2 display-inline-block bg-[#F68153] text-white px-2 py-1">
                        Submit
                    </button>
                </div> : ( */}
                <div className="w-full md:w-1/2 flex flex-col gap-6 px-6">
                <div className="text-sm w-full md:w-8/10 flex flex-col gap-2 justify-between text-left items-center">
                    <div className="text-2xl font-bold self-start leading-none">Download jouw verzoek</div>
                    <div className="self-start">Download hier het verzoek als pdf-bestand, inclusief bronverwijzingen en bijlagen. Je kunt nu zelf besluiten hoe je verder wilt gaan.</div>
                    <button onClick={handleDownloadPdf} disabled={submitting} className="text-base display-inline-block bg-[#154273] mt-2 self-start text-white px-4 py-2">
                    Download verzoek
                    </button>
                </div>

                <div className="text-sm mt-10 w-full md:w-8/10 flex flex-col gap-2 justify-between text-left items-center">
                    <div className="text-2xl font-bold self-start">Dien een informatieverzoek in</div>
                    <div>Hier kun je het Ministerie van Justitie en Veiligheid vragen om meer informatie. Dat kan als je vraag nog niet helemaal is beantwoord met de informatie die openbaar beschikbaar is. Via deze weg kun je extra uitleg geven over je verzoek. Ook kan een medewerker van het Ministerie van Justitie en Veiligheid contact met je opnemen om je verzoek zo goed mogelijk te behandelen.</div>
                    <button onClick={() => setSubmitModal({ isOpen: true, type: 'informatieverzoek' })} disabled={submitting} className="text-base display-inline-block bg-[#F68153] mt-2 self-start text-white px-4 py-2">
                    Stuur een informatieverzoek
                    </button>
                </div>
    
    
                <div className="text-sm mt-10 w-full md:w-8/10 flex flex-col gap-2 justify-between text-left items-center">
                        <div className="text-2xl font-bold self-start">Dien een Woo verzoek in</div>
                        <div>
                        Kies deze optie als je een officiële aanvraag voor informatie wilt doen. Het Ministerie van Justitie en Veiligheid moet dan binnen vier tot zes weken reageren. Je verzoek wordt behandeld volgens de Wet open overheid (Woo). 
                        <p>Waar mogelijk krijg je de documenten en uitleg die nodig zijn om je vraag goed te beantwoorden. Dit kan betekenen dat een ambtenaar van het ministerie contact met je opneemt om je verzoek zo goed mogelijk te behandelen. </p>

                        </div>
                    <button onClick={() => setSubmitModal({ isOpen: true, type: 'woo_verzoek' })} disabled={submitting} className="text-base display-inline-block bg-[#03689B] mt-2 self-start text-white px-4 py-2">
                    Stuur een Woo verzoek
                    </button>
                </div>
                </div>
               </>
            ) : (
                <>
            <div className="text-sm w-full flex justify-between items-center pt-6">Download jouw verzoek als pdf
                <button onClick={handleDownloadPdf} disabled={submitting} className="text-sm display-inline-block bg-[#154273] text-white px-2 py-1">
                    Download
                </button>
            </div>

            <div className="text-sm w-full flex justify-between items-center pt-6">Ontvang jouw verzoek als bijlage in een email 
                <button onClick={() => setIsEmailModalOpen(true)} disabled={submitting} className="text-sm display-inline-block bg-[#F68153] text-white px-2 py-1">
                  Ontvang informatie
                </button>
            </div>


            <div className="text-sm pt-6 w-full flex justify-between items-center">Wil je verdere documenten verzoeken via een Woo verzoek?
                <button onClick={handleSubmit} disabled={submitting} className="text-sm display-inline-block bg-[#03689B] text-white px-2 py-1">
                    Ga verder
                </button>
            </div>
            </>
            )}
            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onSubmit={handleSendPdf}
            />
            <WooSubmitModal
                isOpen={submitModal.isOpen}
                onClose={() => setSubmitModal(prev => ({ ...prev, isOpen: false }))}
                accessToken={accessToken}
                submissionType={submitModal.type}
            />
        </div>
    );
};

export default RequestForm;
