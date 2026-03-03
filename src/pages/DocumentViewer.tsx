import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PDFPageViewer from '../components/PDFPageViewer';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8003';

/**
 * Standalone page for viewing an Oasis document at a specific page.
 *
 * URL: /document?documentId=<uuid>&page=<0-based-page-number>
 *
 * The component fetches a presigned URL from the backend proxy and
 * renders the full PDF using PDFPageViewer, scrolled to the requested page.
 */
const DocumentViewer = () => {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('Document');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchPresignedUrl = useCallback(async () => {
    if (!documentId) {
      setError('Geen document ID opgegeven.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/documents/${documentId}/presigned-url/`, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Kon document niet ophalen (status ${res.status})`);
      }
      const data = await res.json();
      setPdfUrl(data.url);
      setDocumentName(data.name || 'Document');
    } catch (err) {
      console.error('Failed to fetch document:', err);
      setError(err instanceof Error ? err.message : 'Fout bij het ophalen van het document.');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchPresignedUrl();
  }, [fetchPresignedUrl]);

  const handleDownload = useCallback(async () => {
    if (!pdfUrl || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error('Download mislukt');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = documentName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [pdfUrl, documentName, downloading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#03689B] mx-auto mb-3" />
          <p className="text-sm text-gray-600">Document laden…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <p className="text-red-600 font-medium mb-2">Fout</p>
          <p className="text-sm text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="text-sm font-medium text-gray-700 truncate max-w-[70%]">
          {documentName}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Pagina {page + 1}
          </span>
          {pdfUrl && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="text-xs text-[#03689B] hover:underline disabled:opacity-50"
            >
              {downloading ? 'Downloaden…' : 'Download ↓'}
            </button>
          )}
        </div>
      </div>

      {/* PDF viewer */}
      <div className="flex-1 overflow-auto p-4">
        {pdfUrl ? (
          <PDFPageViewer pdfUrl={pdfUrl} pageNumber={page} />
        ) : (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-sm text-gray-500">Geen PDF URL beschikbaar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
