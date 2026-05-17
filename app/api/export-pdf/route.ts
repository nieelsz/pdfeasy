import { NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeFilename } from "@/lib/filename";
import { getFormatSize } from "@/lib/formats";
import { pdfDocumentSchema } from "@/lib/schema";
import { getThemeByColor } from "@/lib/themes";
import type { Page } from "playwright";
import type { GeneratedPdf, PdfPage, PdfStep } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exportPdfDocumentSchema = pdfDocumentSchema.extend({
  generatedWithMock: z.boolean().optional().default(false),
});

const exportSchema = z.object({
  pdf: exportPdfDocumentSchema,
  styles: z.string().max(600_000).optional().default(""),
});

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function getViewport(format: string, orientation: string) {
  if (format === "1080x1920") {
    return orientation === "horizontal" ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
  }

  if (format === "1080x1080") {
    return { width: 1080, height: 1080 };
  }

  return orientation === "horizontal" ? { width: 1123, height: 794 } : { width: 794, height: 1123 };
}

function getPrintCss(input: z.infer<typeof exportSchema>) {
  const size = getFormatSize(input.pdf.format, input.pdf.orientation);
  const pageWidth = `${size.width}${size.unit}`;
  const pageHeight = `${size.height}${size.unit}`;
  const pageSize = size.pdfFormat ? `A4 ${input.pdf.orientation === "horizontal" ? "landscape" : "portrait"}` : `${pageWidth} ${pageHeight}`;

  return `
    @page {
      size: ${pageSize};
      margin: 0;
    }

    html,
    body {
      width: ${pageWidth};
      min-height: ${pageHeight};
      margin: 0;
      background: #ffffff;
    }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    #pdf-preview {
      display: block !important;
      width: ${pageWidth} !important;
      margin: 0 !important;
      padding: 0 !important;
      gap: 0 !important;
      background: #ffffff !important;
    }

    #pdf-preview > div {
      display: block !important;
      width: ${pageWidth} !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .pdf-sheet {
      width: ${pageWidth} !important;
      height: ${pageHeight} !important;
      min-height: ${pageHeight} !important;
      max-width: none !important;
      margin: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: hidden !important;
      break-after: page;
      page-break-after: always;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-sheet:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  `;
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pageLabel(type: PdfPage["type"]) {
  const labels: Record<PdfPage["type"], string> = {
    cover: "Capa",
    text: "Conteudo",
    checklist: "Checklist",
    steps: "Passos",
    benefits: "Beneficios",
    cta: "Acao",
  };

  return labels[type];
}

function documentTypeLabel(type: GeneratedPdf["type"]) {
  const labels: Record<GeneratedPdf["type"], string> = {
    guia_rapido: "Guia rapido",
    checklist: "Checklist",
    mini_ebook: "Mini ebook",
    proposta: "Proposta",
  };

  return labels[type];
}

function renderTextList(title: string, items: string[] | undefined, accent: string, kind: "number" | "check" = "number") {
  if (!items?.length) return "";

  return `
    <section class="mt-4">
      <h3 class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">${escapeHtml(title)}</h3>
      <div class="mt-2 grid gap-2">
        ${items
          .map(
            (item, index) => `
              <div class="flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                ${
                  kind === "check"
                    ? `<span class="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full text-[0.55rem] font-black text-white" style="background:${accent}">✓</span>`
                    : `<span class="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[0.65rem] font-black text-white" style="background:${accent}">${index + 1}</span>`
                }
                <p class="text-xs font-semibold leading-5 text-slate-700">${escapeHtml(item)}</p>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderNoteBlock(title: string, items: string[] | undefined, accent: string) {
  if (!items?.length) return "";

  return `
    <section class="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]" style="color:${accent}">${escapeHtml(title)}</div>
      <div class="mt-2 space-y-1.5">
        ${items.map((item) => `<p class="text-xs font-medium leading-5 text-slate-600">${escapeHtml(item)}</p>`).join("")}
      </div>
    </section>
  `;
}

function renderStepList(steps: PdfStep[] | undefined, accent: string) {
  if (!steps?.length) return "";

  return `
    <section class="mt-4 grid gap-2.5">
      ${steps
        .map(
          (step, index) => `
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div class="flex items-center gap-2">
                <span class="flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-black text-white" style="background:${accent}">${index + 1}</span>
                <h3 class="text-sm font-black leading-5 text-slate-950">${escapeHtml(step.title)}</h3>
              </div>
              <p class="mt-2 text-xs font-medium leading-5 text-slate-700">${escapeHtml(step.content)}</p>
              ${step.action ? `<p class="mt-2 text-xs leading-5 text-slate-600"><strong>Acao:</strong> ${escapeHtml(step.action)}</p>` : ""}
              ${step.example ? `<p class="mt-1 text-xs leading-5 text-slate-600"><strong>Exemplo:</strong> ${escapeHtml(step.example)}</p>` : ""}
              ${step.why ? `<p class="mt-1 text-xs leading-5 text-slate-600"><strong>Por que:</strong> ${escapeHtml(step.why)}</p>` : ""}
            </div>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderSheet(pdf: GeneratedPdf, page: PdfPage, index: number) {
  const theme = getThemeByColor(pdf.primaryColor);
  const isCover = page.type === "cover";
  const isChecklist = page.type === "checklist";
  const isCta = page.type === "cta";

  return `
    <article class="pdf-page pdf-sheet relative flex h-full min-h-full flex-col overflow-hidden bg-white p-[5.4%] text-slate-950">
      <div class="absolute right-0 top-0 h-24 w-2/5 opacity-10" style="background:${theme.value}"></div>
      <div class="absolute bottom-0 left-0 h-20 w-1/3 opacity-10" style="background:${theme.value}"></div>

      <header class="relative flex items-start justify-between gap-8 border-b border-slate-200 pb-4">
        <div class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]" style="color:${theme.value}">PDFEasy</div>
        <div class="rounded-2xl px-4 py-2 text-right text-xs font-bold uppercase tracking-[0.16em]" style="background:${theme.soft};color:${theme.value}">${pageLabel(page.type)}</div>
      </header>

      <main class="relative flex flex-1 flex-col justify-center py-5">
        ${
          isCover
            ? `
              <section class="max-w-[88%]">
                <div class="mb-6 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black" style="background:${theme.soft};color:${theme.value}">${documentTypeLabel(pdf.type)}</div>
                <h1 class="text-[3rem] font-black leading-[0.95] text-slate-950">${escapeHtml(pdf.title)}</h1>
                <p class="mt-5 max-w-2xl text-lg font-semibold leading-7 text-slate-700">${escapeHtml(pdf.subtitle)}</p>
                ${page.content ? `<p class="mt-6 max-w-2xl text-sm leading-6 text-slate-600">${escapeHtml(page.content)}</p>` : ""}
                ${renderNoteBlock("Exemplos", page.examples, theme.value)}
                ${renderTextList("Acoes", page.actionItems, theme.value, "check")}
              </section>
            `
            : `
              <section class="grid flex-1 grid-cols-[0.78fr_1.22fr] gap-6">
                <div class="flex flex-col justify-between rounded-3xl p-5 text-white shadow-soft" style="background:${theme.value}">
                  <div>
                    <p class="mt-5 text-xs font-black uppercase tracking-[0.18em] opacity-80">${pageLabel(page.type)}</p>
                    <h2 class="mt-3 text-3xl font-black leading-tight">${escapeHtml(page.title)}</h2>
                    ${page.subtitle ? `<p class="mt-4 text-sm font-semibold leading-6 opacity-85">${escapeHtml(page.subtitle)}</p>` : ""}
                  </div>
                  ${page.cta ? `<p class="mt-6 rounded-2xl bg-white/15 p-3 text-xs font-black uppercase tracking-[0.12em]">${escapeHtml(page.cta)}</p>` : ""}
                </div>

                <div class="flex flex-col justify-center">
                  ${page.content ? `<p class="text-sm leading-6 text-slate-600">${escapeHtml(page.content)}</p>` : ""}
                  ${renderStepList(page.steps, theme.value)}
                  ${renderTextList(isChecklist ? "Checklist acionavel" : "Pontos principais", page.items, theme.value, isChecklist ? "check" : "number")}
                  ${renderTextList("Acoes praticas", page.actionItems, theme.value, "check")}
                  ${renderNoteBlock("Dica", page.tips, theme.value)}
                  ${renderNoteBlock("Atencao", page.warnings, theme.value)}
                  ${renderNoteBlock("Exemplo", page.examples, theme.value)}
                  ${renderNoteBlock("Erros comuns", page.commonMistakes, theme.value)}
                  ${isCta && page.cta ? `<div class="mt-5 inline-flex w-fit rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white" style="background:${theme.value}">${escapeHtml(page.cta)}</div>` : ""}
                </div>
              </section>
            `
        }
      </main>

      <footer class="relative flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
        <span>${escapeHtml(pdf.format)} • ${escapeHtml(pdf.orientation)}</span>
        <span>${index + 1} / ${pdf.pages.length}</span>
      </footer>
    </article>
  `;
}

function renderPdfHtml(input: z.infer<typeof exportSchema>) {
  const size = getFormatSize(input.pdf.format, input.pdf.orientation);
  const pageWidth = `${size.width}${size.unit}`;
  const pageHeight = `${size.height}${size.unit}`;

  return `
    <div id="pdf-preview">
      <div style="--pdf-page-width:${pageWidth};--pdf-page-height:${pageHeight};--pdf-page-ratio:${size.width} / ${size.height};">
        ${input.pdf.pages.map((page, index) => renderSheet(input.pdf, page, index)).join("")}
      </div>
    </div>
  `;
}

async function assertNoPageOverflow(page: Page) {
  const overflowingPages = await page.$$eval(".pdf-sheet", (sheets) =>
    sheets.flatMap((sheet, index) => {
      const element = sheet as HTMLElement;
      const hasVerticalOverflow = element.scrollHeight > element.clientHeight + 2;
      const hasHorizontalOverflow = element.scrollWidth > element.clientWidth + 2;

      return hasVerticalOverflow || hasHorizontalOverflow ? [index + 1] : [];
    }),
  );

  if (overflowingPages.length) {
    throw new Error(`O conteudo ultrapassou o limite da pagina ${overflowingPages.join(", ")}. Edite ou regenere com menos detalhes.`);
  }
}

export async function POST(request: Request) {
  let browser;

  try {
    const input = exportSchema.parse(await request.json());
    const size = getFormatSize(input.pdf.format, input.pdf.orientation);
    const viewport = getViewport(input.pdf.format, input.pdf.orientation);
    const baseUrl = getBaseUrl(request);
    const filename = `${sanitizeFilename(input.pdf.title)}.pdf`;
    const { chromium } = await import("playwright");
    const bodyHtml = renderPdfHtml(input);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport });

    await page.setContent(
      `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=${viewport.width}, initial-scale=1" />
          <base href="${baseUrl}" />
          ${input.styles}
          <style>${getPrintCss(input)}</style>
        </head>
        <body>${bodyHtml}</body>
      </html>
      `,
      { waitUntil: "networkidle" },
    );

    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await assertNoPageOverflow(page);

    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      ...(size.pdfFormat
        ? { format: size.pdfFormat, landscape: input.pdf.orientation === "horizontal" }
        : { width: `${size.width}px`, height: `${size.height}px` }),
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Não foi possível exportar o PDF.";

    return new NextResponse(`Falha ao exportar o PDF: ${message}`, { status: 400 });
  } finally {
    await browser?.close();
  }
}
