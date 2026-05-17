"use client";

import { useEffect, useRef, useState } from "react";
import { getCssPageSize, getPreviewPixelSize } from "@/lib/formats";
import type { GeneratedPdf } from "@/lib/schema";
import { WhatsAppGuideTemplate } from "@/components/WhatsAppGuideTemplate";
import type { CSSProperties } from "react";

type PdfPreviewProps = {
  pdf: GeneratedPdf | null;
};

export function PdfPreview({ pdf }: PdfPreviewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(([entry]) => {
      setAvailableWidth(entry.contentRect.width);
    });

    observer.observe(viewport);
    setAvailableWidth(viewport.clientWidth);

    return () => observer.disconnect();
  }, [pdf]);

  if (!pdf) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center sm:min-h-[540px] sm:rounded-[2rem] sm:p-8">
        <div className="max-w-sm">
          <p className="text-lg font-bold text-slate-900">Seu preview aparece aqui</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Preencha o briefing e gere o JSON estruturado para ver o template renderizado em HTML.
          </p>
        </div>
      </div>
    );
  }

  const pageSize = getCssPageSize(pdf.format, pdf.orientation);
  const previewSize = getPreviewPixelSize(pdf.format, pdf.orientation);
  const pageGap = availableWidth < 640 ? 14 : 20;
  const previewPadding = availableWidth < 640 ? 16 : 40;
  const scale = availableWidth ? Math.min(1, Math.max(0.28, (availableWidth - previewPadding) / previewSize.width)) : 1;
  const scaledHeight = pdf.pages.length * previewSize.height * scale + Math.max(0, pdf.pages.length - 1) * pageGap * scale;

  return (
    <div ref={viewportRef} className="overflow-x-hidden overflow-y-auto rounded-3xl bg-slate-200/70 p-3 shadow-inner sm:rounded-[2rem] sm:p-5">
      <div
        id="pdf-preview"
        className="mx-auto flex justify-center"
        style={{ minHeight: scaledHeight || undefined }}
      >
        <div
          className="flex origin-top flex-col [&_.pdf-sheet]:mx-auto [&_.pdf-sheet]:max-w-none [&_.pdf-sheet]:rounded-2xl [&_.pdf-sheet]:shadow-soft sm:[&_.pdf-sheet]:rounded-[1.4rem]"
          style={
            {
              "--pdf-page-width": pageSize.width,
              "--pdf-page-height": pageSize.minHeight,
              "--pdf-page-ratio": pageSize.aspectRatio,
              gap: pageGap,
              transform: `scale(${scale})`,
            } as CSSProperties
          }
        >
          <WhatsAppGuideTemplate pdf={pdf} />
        </div>
      </div>
    </div>
  );
}
