import { useState } from 'react';

interface DocumentFile {
  type: 'Identity Proof' | 'Business Registration' | 'Professional License' | 'GST Certificate' | 'Experience Certificate' | 'Portfolio Documents' | string;
  name: string;
  size?: string;
  uploadedAt?: string;
  metadata?: string;
}

interface DocumentViewerProps {
  documents: DocumentFile[];
}

export default function DocumentViewer({ documents }: DocumentViewerProps) {
  const [activeDoc, setActiveDoc] = useState<DocumentFile | null>(documents[0] || null);
  const [zoomScale, setZoomScale] = useState<number>(100);

  if (documents.length === 0) {
    return (
      <div className="bg-white border border-light-border p-8 rounded-3xl text-center shadow-apple-sm text-stone-400 select-none">
        No documents uploaded for verification.
      </div>
    );
  }

  // Fallback activeDoc if current activeDoc is not in documents array (when active applicant changes)
  const currentDoc = activeDoc && documents.some(d => d.name === activeDoc.name) ? activeDoc : documents[0];

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(prev - 25, 50));
  };

  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-4 text-left select-none">
      <div className="border-b border-light-border/40 pb-2 flex justify-between items-center">
        <h4 className="text-2xs font-black uppercase text-stone-900 tracking-wider">
          📄 Submitted Document Files
        </h4>
        <span className="text-3xs bg-stone-150 text-stone-600 px-2 py-0.5 rounded font-black uppercase">
          {documents.length} Files
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Document List */}
        <div className="lg:col-span-1 border-r border-light-border/40 pr-2 space-y-2 max-h-[300px] overflow-y-auto">
          {documents.map((doc, idx) => {
            const isActive = currentDoc.name === doc.name;
            return (
              <div 
                key={idx}
                onClick={() => {
                  setActiveDoc(doc);
                  setZoomScale(100);
                }}
                className={`p-3 border rounded-xl cursor-pointer text-xs space-y-1.5 transition-colors ${
                  isActive 
                    ? 'border-brand-emerald bg-emerald-50/20' 
                    : 'border-light-border hover:border-stone-400'
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <strong className="block text-stone-900 font-bold leading-tight break-all">
                    {doc.name}
                  </strong>
                </div>
                <div className="flex justify-between text-3xs text-stone-450 font-bold uppercase tracking-wider">
                  <span>{doc.type}</span>
                  <span>{doc.size || '320 KB'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Document Preview and Metadata (Col span 2) */}
        <div className="lg:col-span-2 space-y-3 flex flex-col justify-between min-h-[300px]">
          {/* Controls */}
          <div className="flex justify-between items-center bg-stone-50 border border-stone-200 p-2 rounded-xl text-xs font-semibold text-stone-700">
            <span className="truncate max-w-[180px] font-bold text-stone-850">
              Preview: {currentDoc.name}
            </span>
            <div className="flex gap-2 text-3xs font-black uppercase tracking-wider shrink-0">
              <button 
                onClick={handleZoomOut}
                className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-250 rounded cursor-pointer"
                title="Zoom Out"
              >
                ➖
              </button>
              <span className="self-center px-1.5 font-mono">{zoomScale}%</span>
              <button 
                onClick={handleZoomIn}
                className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-250 rounded cursor-pointer"
                title="Zoom In"
              >
                ➕
              </button>
              <button 
                onClick={() => alert(`Simulating file download: ${currentDoc.name}`)}
                className="px-2 py-1 bg-brand-emerald hover:bg-emerald-800 text-white rounded cursor-pointer"
              >
                Download
              </button>
            </div>
          </div>

          {/* Fake Preview Sandbox */}
          <div className="flex-1 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden min-h-[180px]">
            <div 
              className="bg-white p-6 shadow-apple-xs border border-stone-300 w-[80%] h-[90%] text-center flex flex-col justify-center gap-2 transform transition-transform duration-250"
              style={{ transform: `scale(${zoomScale / 100})` }}
            >
              <span className="text-2xl">📄</span>
              <strong className="text-2xs text-stone-850 truncate max-w-[200px]">{currentDoc.name}</strong>
              <p className="text-3xs text-stone-500 font-bold uppercase tracking-widest">{currentDoc.type}</p>
              <span className="text-3xs text-stone-300 font-mono mt-1 select-none">
                [Certified DBC Encrypted Sandboxed File Review]
              </span>
            </div>
          </div>

          {/* Document Metadata details */}
          <div className="bg-stone-50 border border-stone-150 p-3.5 rounded-xl space-y-1.5 text-2xs text-stone-600 font-semibold">
            <h5 className="text-3xs font-black uppercase tracking-wider text-stone-450 border-b border-light-border/40 pb-1">
              Document Audit Details
            </h5>
            <p>File Hash: <span className="font-mono text-stone-900">{currentDoc.metadata || 'SHA-256: 8a5d3fbc9c882103f...'}</span></p>
            <p>Uploaded Time: <span className="text-stone-900">{currentDoc.uploadedAt || '03 Aug 2026, 12:00 PM'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
export type { DocumentFile };
