import { AlertTriangle, CheckCircle2, FileText, Lightbulb, ListChecks, MessageCircle, Sparkles, Target } from "lucide-react";
import { getThemeByColor } from "@/lib/themes";
import type { GeneratedPdf, PdfPage, PdfStep } from "@/lib/schema";

type WhatsAppGuideTemplateProps = {
  pdf: GeneratedPdf;
};

function pageLabel(type: PdfPage["type"]) {
  const labels: Record<PdfPage["type"], string> = {
    cover: "Capa",
    text: "Conteúdo",
    checklist: "Checklist",
    steps: "Passos",
    benefits: "Benefícios",
    cta: "Ação",
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

function PageIcon({ type, className }: { type: PdfPage["type"]; className?: string }) {
  if (type === "checklist") return <ListChecks className={className} />;
  if (type === "steps" || type === "benefits") return <Sparkles className={className} />;
  if (type === "cta") return <MessageCircle className={className} />;

  return <FileText className={className} />;
}

function TextList({ title, items, accent, kind = "number" }: { title: string; items?: string[]; accent: string; kind?: "number" | "check" }) {
  const visibleItems = items ?? [];

  if (!visibleItems.length) return null;

  return (
    <section className="mt-4">
      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      <div className="mt-2 grid gap-2">
        {visibleItems.map((item, index) => (
          <div key={`${title}-${item}`} className="flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            {kind === "check" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" style={{ color: accent }} />
            ) : (
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[0.65rem] font-black text-white" style={{ background: accent }}>
                {index + 1}
              </span>
            )}
            <p className="text-xs font-semibold leading-5 text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function NoteBlock({ title, items, accent, tone }: { title: string; items?: string[]; accent: string; tone: "tip" | "warning" | "example" }) {
  const visibleItems = items ?? [];

  if (!visibleItems.length) return null;

  const icon =
    tone === "warning" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : tone === "example" ? (
      <Target className="h-4 w-4" />
    ) : (
      <Lightbulb className="h-4 w-4" />
    );

  return (
    <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: accent }}>
        {icon}
        {title}
      </div>
      <div className="mt-2 space-y-1.5">
        {visibleItems.map((item) => (
          <p key={`${title}-${item}`} className="text-xs font-medium leading-5 text-slate-600">
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function StepList({ steps, accent }: { steps?: PdfStep[]; accent: string }) {
  const visibleSteps = steps ?? [];

  if (!visibleSteps.length) return null;

  return (
    <section className="mt-4 grid gap-2.5">
      {visibleSteps.map((step, index) => (
        <div key={`${step.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-black text-white" style={{ background: accent }}>
              {index + 1}
            </span>
            <h3 className="text-sm font-black leading-5 text-slate-950">{step.title}</h3>
          </div>
          <p className="mt-2 text-xs font-medium leading-5 text-slate-700">{step.content}</p>
          {step.action ? <p className="mt-2 text-xs leading-5 text-slate-600"><strong>Ação:</strong> {step.action}</p> : null}
          {step.example ? <p className="mt-1 text-xs leading-5 text-slate-600"><strong>Exemplo:</strong> {step.example}</p> : null}
          {step.why ? <p className="mt-1 text-xs leading-5 text-slate-600"><strong>Por quê:</strong> {step.why}</p> : null}
        </div>
      ))}
    </section>
  );
}

function PdfSheet({ pdf, page, index }: { pdf: GeneratedPdf; page: PdfPage; index: number }) {
  const theme = getThemeByColor(pdf.primaryColor);
  const isCover = page.type === "cover";
  const isChecklist = page.type === "checklist";
  const isCta = page.type === "cta";

  return (
    <article className="pdf-page pdf-sheet relative flex h-full min-h-full flex-col overflow-hidden bg-white p-[5.4%] text-slate-950">
      <div className="absolute right-0 top-0 h-24 w-2/5 opacity-10" style={{ background: theme.value }} />
      <div className="absolute bottom-0 left-0 h-20 w-1/3 opacity-10" style={{ background: theme.value }} />

      <header className="relative flex items-start justify-between gap-8 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]" style={{ color: theme.value }}>
          <MessageCircle className="h-4 w-4" />
          PDFEasy
        </div>
        <div className="rounded-2xl px-4 py-2 text-right text-xs font-bold uppercase tracking-[0.16em]" style={{ background: theme.soft, color: theme.value }}>
          {pageLabel(page.type)}
        </div>
      </header>

      <main className="relative flex flex-1 flex-col justify-center py-5">
        {isCover ? (
          <section className="max-w-[88%]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black" style={{ background: theme.soft, color: theme.value }}>
              <PageIcon type={page.type} className="h-4 w-4" />
              {documentTypeLabel(pdf.type)}
            </div>
            <h1 className="text-[3rem] font-black leading-[0.95] text-slate-950">{pdf.title}</h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-7 text-slate-700">{pdf.subtitle}</p>
            {page.content ? <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">{page.content}</p> : null}
            <NoteBlock title="Exemplos" items={page.examples} accent={theme.value} tone="example" />
            <TextList title="Ações" items={page.actionItems} accent={theme.value} kind="check" />
          </section>
        ) : (
          <section className="grid flex-1 grid-cols-[0.78fr_1.22fr] gap-6">
            <div className="flex flex-col justify-between rounded-3xl p-5 text-white shadow-soft" style={{ background: theme.value }}>
              <div>
                <PageIcon type={page.type} className="h-8 w-8" />
                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] opacity-80">{pageLabel(page.type)}</p>
                <h2 className="mt-3 text-3xl font-black leading-tight">{page.title}</h2>
                {page.subtitle ? <p className="mt-4 text-sm font-semibold leading-6 opacity-85">{page.subtitle}</p> : null}
              </div>
              {page.cta ? <p className="mt-6 rounded-2xl bg-white/15 p-3 text-xs font-black uppercase tracking-[0.12em]">{page.cta}</p> : null}
            </div>

            <div className="flex flex-col justify-center">
              {page.content ? <p className="text-sm leading-6 text-slate-600">{page.content}</p> : null}

              <StepList steps={page.steps} accent={theme.value} />
              <TextList title={isChecklist ? "Checklist acionável" : "Pontos principais"} items={page.items} accent={theme.value} kind={isChecklist ? "check" : "number"} />
              <TextList title="Ações práticas" items={page.actionItems} accent={theme.value} kind="check" />
              <NoteBlock title="Dica" items={page.tips} accent={theme.value} tone="tip" />
              <NoteBlock title="Atenção" items={page.warnings} accent={theme.value} tone="warning" />
              <NoteBlock title="Exemplo" items={page.examples} accent={theme.value} tone="example" />
              <NoteBlock title="Erros comuns" items={page.commonMistakes} accent={theme.value} tone="warning" />

              {isCta && page.cta ? (
                <div className="mt-5 inline-flex w-fit rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white" style={{ background: theme.value }}>
                  {page.cta}
                </div>
              ) : null}
            </div>
          </section>
        )}
      </main>

      <footer className="relative flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
        <span>
          {pdf.format} • {pdf.orientation}
        </span>
        <span>
          {index + 1} / {pdf.pages.length}
        </span>
      </footer>
    </article>
  );
}

export function WhatsAppGuideTemplate({ pdf }: WhatsAppGuideTemplateProps) {
  return (
    <>
      {pdf.pages.map((page, index) => (
        <PdfSheet key={`${page.type}-${page.title}-${index}`} pdf={pdf} page={page} index={index} />
      ))}
    </>
  );
}
