"use client";

import { useState } from "react";

type DocType = "permit" | "id" | "photo";

interface Doc {
  label: string;
  url: string;
  type: DocType;
}

const TYPE_ICON: Record<DocType, string> = {
  permit: "📋",
  id: "🪪",
  photo: "🏠",
};

const isImage = (url: string) =>
  /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i.test(url);

const isPdf = (url: string) => /\.pdf(\?.*)?$/i.test(url);

export default function DocumentViewer({ documents }: { documents: Doc[] }) {
  const [active, setActive] = useState<Doc>(documents[0]);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Review all submitted documents carefully before making a decision. Click a document to preview it.
      </p>

      {/* Document Tabs */}
      <div className="flex flex-wrap gap-2">
        {documents.map((doc) => (
          <button
            key={doc.label}
            onClick={() => setActive(doc)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              active.label === doc.label
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] bg-[var(--muted)]"
            }`}
          >
            <span>{TYPE_ICON[doc.type]}</span>
            <span>{doc.label}</span>
          </button>
        ))}
      </div>

      {/* Preview Area */}
      <div className="relative bg-[var(--muted)] rounded-2xl overflow-hidden border border-[var(--border)] min-h-[340px] flex flex-col items-center justify-center">
        {isImage(active.url) ? (
          <>
            <img
              src={active.url}
              alt={active.label}
              className="max-h-[400px] w-full object-contain"
            />
            <button
              onClick={() => setFullscreen(true)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
              title="View fullscreen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </>
        ) : isPdf(active.url) ? (
          <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-3xl">📄</div>
            <p className="font-semibold text-[var(--foreground)]">{active.label}</p>
            <p className="text-sm text-[var(--muted-foreground)]">PDF document — open in a new tab to review</p>
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open PDF
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center text-3xl">📁</div>
            <p className="font-semibold text-[var(--foreground)]">{active.label}</p>
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              Open Document
            </a>
          </div>
        )}

        {/* Label overlay */}
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
          {TYPE_ICON[active.type]} {active.label}
        </div>
      </div>

      {/* Download link */}
      <a
        href={active.url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download {active.label}
      </a>

      {/* Fullscreen Lightbox */}
      {fullscreen && isImage(active.url) && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
            onClick={() => setFullscreen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={active.url}
            alt={active.label}
            className="max-h-full max-w-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}