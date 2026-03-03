import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8003';

type DownloadStatus = 'loading' | 'downloading' | 'success' | 'error';

/**
 * Download page for Oasis documents.
 *
 * URL: /download?documentId=<uuid>
 *
 * Fetches the presigned URL from the backend proxy, downloads the file
 * as a blob, and triggers a browser save-as with the correct filename.
 * Shows a clean status page throughout.
 */
const DocumentDownload = () => {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId') || '';

  const [status, setStatus] = useState<DownloadStatus>('loading');
  const [documentName, setDocumentName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasStarted = useRef(false);

  const startDownload = useCallback(async () => {
    if (!documentId) {
      setErrorMessage('Geen document ID opgegeven.');
      setStatus('error');
      return;
    }

    try {
      // Step 1: Fetch presigned URL + name from backend proxy
      setStatus('loading');
      const metaRes = await fetch(`${BACKEND_URL}/api/documents/${documentId}/presigned-url/`, { credentials: 'include' });
      if (!metaRes.ok) {
        throw new Error(`Kon documentgegevens niet ophalen (status ${metaRes.status})`);
      }
      const meta = await metaRes.json();
      const presignedUrl = meta.url;
      const name = meta.name || `document-${documentId.slice(0, 8)}.pdf`;
      setDocumentName(name);

      if (!presignedUrl) {
        throw new Error('Geen download URL beschikbaar voor dit document.');
      }

      // Step 2: Download the actual file as a blob
      setStatus('downloading');
      const fileRes = await fetch(presignedUrl);
      if (!fileRes.ok) {
        throw new Error(`Download mislukt (status ${fileRes.status})`);
      }
      const blob = await fileRes.blob();

      // Step 3: Trigger browser download with correct filename
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Clean up after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      setStatus('success');
    } catch (err) {
      console.error('Download failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het downloaden.');
      setStatus('error');
    }
  }, [documentId]);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      startDownload();
    }
  }, [startDownload]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        {/* Loading: fetching document info */}
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#03689B] mx-auto mb-4" />
            <p className="text-sm text-gray-600">Document voorbereiden…</p>
          </>
        )}

        {/* Downloading: fetching the actual file */}
        {status === 'downloading' && (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#03689B] mx-auto mb-4" />
            <p className="font-medium text-gray-800 mb-1">Downloaden…</p>
            {documentName && (
              <p className="text-sm text-gray-500 break-all">{documentName}</p>
            )}
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-gray-800 mb-1">Download voltooid</p>
            {documentName && (
              <p className="text-sm text-gray-500 break-all mb-4">{documentName}</p>
            )}
            <button
              onClick={startDownload}
              className="text-sm text-[#03689B] hover:underline"
            >
              Opnieuw downloaden
            </button>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-medium text-red-700 mb-1">Download mislukt</p>
            <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
            <button
              onClick={() => {
                hasStarted.current = false;
                startDownload();
              }}
              className="text-sm bg-[#03689B] text-white px-4 py-2 rounded hover:bg-[#025a85] transition-colors"
            >
              Probeer opnieuw
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentDownload;
