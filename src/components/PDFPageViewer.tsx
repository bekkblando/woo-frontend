import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Vite emits the worker as a hashed static asset with correct MIME type
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

interface PDFPageViewerProps {
  pdfUrl: string;
  pageNumber: number; // 0-based chunk_index; we convert to 1-based for pdfjs
}

/**
 * Renders ALL pages of a PDF document and scrolls to the target page.
 * Users can scroll through the entire document freely.
 */
const PDFPageViewer: React.FC<PDFPageViewerProps> = ({ pdfUrl, pageNumber }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(pageNumber + 1); // 1-based for display

  const setPageRef = useCallback((pageNum: number, el: HTMLCanvasElement | null) => {
    if (el) {
      pageRefs.current.set(pageNum, el);
    } else {
      pageRefs.current.delete(pageNum);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let pdfDocRef: pdfjs.PDFDocumentProxy | null = null;

    const renderAllPages = async () => {
      setLoading(true);
      setError(null);

      try {
        const pdfDoc = await pdfjs.getDocument(pdfUrl).promise;
        pdfDocRef = pdfDoc;

        if (!isMounted) return;

        setNumPages(pdfDoc.numPages);

        const scale = 1.5;

        // Render all pages
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (!isMounted) break;

          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale });

          // Wait for the canvas ref to be available
          const waitForCanvas = (): Promise<HTMLCanvasElement> => {
            return new Promise((resolve) => {
              const check = () => {
                const canvas = pageRefs.current.get(i);
                if (canvas) {
                  resolve(canvas);
                } else {
                  requestAnimationFrame(check);
                }
              };
              check();
            });
          };

          const canvas = await waitForCanvas();
          if (!isMounted) break;

          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          // After the target page is rendered, scroll to it and hide loading
          if (i === pageNumber + 1) {
            if (isMounted) {
              setLoading(false);
              // Scroll to the target page
              setTimeout(() => {
                canvas.scrollIntoView({ behavior: 'auto', block: 'start' });
              }, 50);
            }
          }
        }

        // If target page is beyond the document, just stop loading
        if (isMounted && loading) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error rendering PDF:', err);
        if (isMounted) {
          setError('Kan PDF niet laden.');
          setLoading(false);
        }
      }
    };

    renderAllPages();

    return () => {
      isMounted = false;
      if (pdfDocRef) {
        pdfDocRef.destroy();
      }
    };
  }, [pdfUrl, pageNumber]);

  // Track which page is currently visible via IntersectionObserver
  useEffect(() => {
    if (numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page'));
            if (pageNum) {
              setCurrentPage(pageNum);
            }
          }
        }
      },
      {
        root: containerRef.current?.parentElement,
        threshold: 0.5,
      }
    );

    // Observe all canvases
    pageRefs.current.forEach((canvas, pageNum) => {
      canvas.setAttribute('data-page', String(pageNum));
      observer.observe(canvas);
    });

    return () => observer.disconnect();
  }, [numPages, loading]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] border border-gray-300 rounded-lg bg-gray-50 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4">
      {loading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#03689B] mx-auto mb-2" />
            <p className="text-sm text-gray-600">PDF laden...</p>
          </div>
        </div>
      )}

      {/* Render canvas placeholders for all pages */}
      {Array.from({ length: numPages }, (_, i) => {
        const pg = i + 1;
        return (
          <div key={pg} className="w-full flex flex-col items-center">
            <div className="text-xs text-gray-400 mb-1">Pagina {pg} / {numPages}</div>
            <canvas
              ref={(el) => setPageRef(pg, el)}
              style={{ maxWidth: '100%', display: loading && pg !== pageNumber + 1 ? 'none' : 'block' }}
            />
          </div>
        );
      })}

      {/* Floating page indicator */}
      {!loading && numPages > 0 && (
        <div className="sticky bottom-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
          Pagina {currentPage} / {numPages}
        </div>
      )}
    </div>
  );
};

export default PDFPageViewer;
