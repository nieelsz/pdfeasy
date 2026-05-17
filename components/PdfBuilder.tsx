"use client";

import { Check, Clipboard, Download, Loader2, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Field } from "@/components/Field";
import { PdfPreview } from "@/components/PdfPreview";
import { sanitizeFilename } from "@/lib/filename";
import { THEME_COLORS } from "@/lib/themes";
import type {
  AudienceLevel,
  DeliveryType,
  DepthLevel,
  GeneratePdfInput,
  GeneratedPdf,
  PdfFormat,
  PdfOrientation,
  PdfType,
  VoiceTone,
} from "@/lib/schema";

const DRAFT_KEY = "pdfeasy:draft:v1";

const DEFAULT_FORM: GeneratePdfInput = {
  type: "guia_rapido",
  format: "A4",
  orientation: "vertical",
  primaryColor: THEME_COLORS[0].value,
  briefing:
    "Crie um guia rapido para pequenos negocios venderem mais pelo WhatsApp, com foco em abordagem inicial, organizacao da oferta e follow-up.",
  objetivoDoPdf: "Ensinar um processo simples para transformar conversas em vendas pelo WhatsApp.",
  publicoAlvo: "Pequenos negocios, prestadores de servico e lojistas que vendem por conversa.",
  nivelDoPublico: "iniciante",
  tomDeVoz: "direto",
  pontosObrigatorios: "Abordagem inicial, organizacao da oferta, prova de confianca e follow-up em 24h.",
  quantidadeDePaginas: 6,
  profundidade: "detalhado",
  tipoDeEntrega: "whatsapp",
};

type PageTextField = "title" | "subtitle" | "content" | "cta";
type PageListField = "items" | "actionItems";
type ExternalBriefingJson = {
  objetivoDoPdf?: string;
  publicoAlvo?: string;
  nivelDoPublico?: AudienceLevel;
  tomDeVoz?: VoiceTone;
  tipoDeEntrega?: DeliveryType;
  promessaPrincipal?: string;
  contextoDoNegocio?: string;
  pontosObrigatorios?: string[] | string;
  restricoes?: string[] | string;
  exemplos?: string[] | string;
};

const EXTERNAL_AI_JSON_TEMPLATE = {
  objetivoDoPdf: "Qual resultado o leitor deve conseguir depois de ler o PDF?",
  publicoAlvo: "Quem vai ler? Cargo, contexto, dores e nivel de conhecimento.",
  nivelDoPublico: "iniciante | intermediario | avancado",
  tomDeVoz: "direto | educativo | premium | agressivo | tecnico | simples",
  tipoDeEntrega: "whatsapp | checkout | proposta | ebook | bonus | interno",
  promessaPrincipal: "A transformacao central do material.",
  contextoDoNegocio: "Produto, servico, mercado, oferta, preco ou momento atual.",
  pontosObrigatorios: [
    "Topico, etapa, oferta ou objecao que precisa aparecer",
    "Exemplo real que deve ser citado",
    "CTA desejado no final",
  ],
  restricoes: ["O que evitar", "Termos que nao devem aparecer", "Limites de promessa ou linguagem"],
  exemplos: ["Casos, frases, mensagens, frameworks ou ideias que devem inspirar o PDF"],
};

const EXTERNAL_AI_PROMPT = `Preencha este JSON com base no meu negocio/produto para eu colar no PDFEasy.

Instrucoes:
- Responda somente com JSON valido.
- Nao use markdown.
- Nao invente dados criticos; quando faltar contexto, complete com boas praticas realistas e deixe claro no texto.
- Seja especifico, acionavel e orientado a um PDF comercial/educativo.
- Use portugues do Brasil.

JSON modelo:
${JSON.stringify(EXTERNAL_AI_JSON_TEMPLATE, null, 2)}

Contexto do meu negocio/produto:
[cole aqui informacoes sobre produto, publico, oferta, preco, mercado, objetivo, objecoes e exemplos reais]`;

const audienceLevelValues = ["iniciante", "intermediario", "avancado"] as const;
const voiceToneValues = ["direto", "educativo", "premium", "agressivo", "tecnico", "simples"] as const;
const deliveryTypeValues = ["whatsapp", "checkout", "proposta", "ebook", "bonus", "interno"] as const;

function fieldClassName(extra = "") {
  return `w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none ring-slate-950/10 transition focus:ring-4 ${extra}`;
}

function listToText(value: string[] | string | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");

  return value ?? "";
}

function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

export function PdfBuilder() {
  const [form, setForm] = useState<GeneratePdfInput>(DEFAULT_FORM);
  const [pdf, setPdf] = useState<GeneratedPdf | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [externalJson, setExternalJson] = useState("");
  const [isPromptCopied, setIsPromptCopied] = useState(false);

  const canExport = useMemo(() => Boolean(pdf && !isGenerating && !isExporting), [isExporting, isGenerating, pdf]);

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(DRAFT_KEY);

      if (savedDraft) {
        const draft = JSON.parse(savedDraft) as { form?: GeneratePdfInput; pdf?: GeneratedPdf | null };
        if (draft.form) setForm({ ...DEFAULT_FORM, ...draft.form });
        if (draft.pdf) setPdf(draft.pdf);
      }
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    } finally {
      setHasLoadedDraft(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedDraft) return;

    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, pdf }));
  }, [form, hasLoadedDraft, pdf]);

  function updateForm<K extends keyof GeneratePdfInput>(key: K, value: GeneratePdfInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));

    if (key === "format" || key === "orientation" || key === "primaryColor" || key === "type") {
      setPdf((current) => (current ? { ...current, [key]: value } : current));
    }
  }

  function updatePdfDocument<K extends "title" | "subtitle">(key: K, value: GeneratedPdf[K]) {
    setPdf((current) => (current ? { ...current, [key]: value } : current));
  }

  function updatePdfPage(index: number, key: PageTextField, value: string) {
    setPdf((current) => {
      if (!current) return current;

      return {
        ...current,
        pages: current.pages.map((page, pageIndex) => (pageIndex === index ? { ...page, [key]: value } : page)),
      };
    });
  }

  function updatePdfPageList(index: number, key: PageListField, itemIndex: number, value: string) {
    setPdf((current) => {
      if (!current) return current;

      return {
        ...current,
        pages: current.pages.map((page, pageIndex) => {
          if (pageIndex !== index) return page;

          const items = [...(page[key] ?? [])];
          items[itemIndex] = value;

          return { ...page, [key]: items.filter(Boolean) };
        }),
      };
    });
  }

  async function copyExternalPrompt() {
    try {
      await navigator.clipboard.writeText(EXTERNAL_AI_PROMPT);
      setIsPromptCopied(true);
      setStatus("Prompt copiado. Cole na sua IA preferida.");
      window.setTimeout(() => {
        setIsPromptCopied(false);
        setStatus(null);
      }, 1600);
    } catch {
      setError("Nao foi possivel copiar automaticamente. Selecione e copie o prompt manualmente.");
    }
  }

  function applyExternalJson() {
    setError(null);

    try {
      const parsed = JSON.parse(externalJson) as ExternalBriefingJson;
      const pontosObrigatorios = listToText(parsed.pontosObrigatorios);
      const restricoes = listToText(parsed.restricoes);
      const exemplos = listToText(parsed.exemplos);
      const briefingParts = [
        parsed.promessaPrincipal ? `Promessa principal: ${parsed.promessaPrincipal}` : "",
        parsed.contextoDoNegocio ? `Contexto do negocio: ${parsed.contextoDoNegocio}` : "",
        pontosObrigatorios ? `Pontos obrigatorios:\n${pontosObrigatorios}` : "",
        restricoes ? `Restricoes:\n${restricoes}` : "",
        exemplos ? `Exemplos e referencias:\n${exemplos}` : "",
      ].filter(Boolean);

      setForm((current) => ({
        ...current,
        objetivoDoPdf: parsed.objetivoDoPdf?.trim() || current.objetivoDoPdf,
        publicoAlvo: parsed.publicoAlvo?.trim() || current.publicoAlvo,
        nivelDoPublico: isOneOf(audienceLevelValues, parsed.nivelDoPublico) ? parsed.nivelDoPublico : current.nivelDoPublico,
        tomDeVoz: isOneOf(voiceToneValues, parsed.tomDeVoz) ? parsed.tomDeVoz : current.tomDeVoz,
        tipoDeEntrega: isOneOf(deliveryTypeValues, parsed.tipoDeEntrega) ? parsed.tipoDeEntrega : current.tipoDeEntrega,
        pontosObrigatorios: pontosObrigatorios || current.pontosObrigatorios,
        briefing: briefingParts.length ? briefingParts.join("\n\n") : current.briefing,
      }));
      setStatus("JSON aplicado ao briefing.");
      window.setTimeout(() => setStatus(null), 1600);
    } catch {
      setError("JSON invalido. Cole somente o objeto JSON retornado pela IA, sem markdown ou texto antes/depois.");
    }
  }

  async function generatePdf() {
    setIsGenerating(true);
    setError(null);
    setStatus("Preparando briefing para a IA...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setStatus("Validando estrutura do conteudo...");
      setPdf((await response.json()) as GeneratedPdf);
      setStatus("Preview pronto para revisao.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel gerar o conteudo.");
    } finally {
      setIsGenerating(false);
      window.setTimeout(() => setStatus(null), 1400);
    }
  }

  async function exportPdf() {
    if (!pdf) return;

    setIsExporting(true);
    setError(null);
    setStatus("Preparando template para exportacao...");

    try {
      const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
        .map((node) => node.outerHTML)
        .join("\n");

      setStatus("Renderizando e validando paginas...");

      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf, styles }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${sanitizeFilename(pdf.title)}.pdf`;
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus("PDF exportado.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel exportar o PDF.");
    } finally {
      setIsExporting(false);
      window.setTimeout(() => setStatus(null), 1400);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-3 py-3 sm:px-5 sm:py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1540px] flex-col gap-4 sm:gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-white bg-white/85 px-4 py-4 shadow-sm backdrop-blur sm:rounded-[2rem] sm:px-6 sm:py-5 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">PDFEasy</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Gere conteudo estruturado por IA, revise cada pagina e exporte PDFs com templates React fixos.
            </p>
          </div>
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={generatePdf}
              disabled={isGenerating}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
              Gerar preview
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={!canExport}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-950 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar PDF
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[430px_minmax(0,1fr)] lg:gap-6">
          <section className="order-2 rounded-3xl border border-white bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5 lg:order-1">
            <div className="space-y-4 sm:space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo de PDF">
                  <select value={form.type} onChange={(event) => updateForm("type", event.target.value as PdfType)} className={fieldClassName("h-12 py-0 font-semibold")}>
                    <option value="guia_rapido">Guia rapido</option>
                    <option value="checklist">Checklist</option>
                    <option value="mini_ebook">Mini ebook</option>
                    <option value="proposta">Proposta</option>
                  </select>
                </Field>

                <Field label="Formato">
                  <select value={form.format} onChange={(event) => updateForm("format", event.target.value as PdfFormat)} className={fieldClassName("h-12 py-0 font-semibold")}>
                    <option value="A4">A4</option>
                    <option value="1080x1920">1080 x 1920</option>
                    <option value="1080x1080">1080 x 1080</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Orientacao">
                  <select value={form.orientation} onChange={(event) => updateForm("orientation", event.target.value as PdfOrientation)} className={fieldClassName("h-12 py-0 font-semibold")}>
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </Field>

                <Field label="Paginas">
                  <input
                    type="number"
                    min={5}
                    max={8}
                    value={form.quantidadeDePaginas}
                    onChange={(event) => updateForm("quantidadeDePaginas", Number(event.target.value))}
                    className={fieldClassName("h-12 py-0 font-semibold")}
                  />
                </Field>
              </div>

              <Field label="Cor principal" hint="A cor alimenta o tema do template, nao o conteudo da IA.">
                <div className="grid grid-cols-5 gap-2">
                  {THEME_COLORS.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      aria-label={theme.name}
                      onClick={() => updateForm("primaryColor", theme.value)}
                      className="h-12 rounded-2xl border-2 transition focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                      style={{
                        background: theme.value,
                        borderColor: form.primaryColor === theme.value ? "#0f172a" : "transparent",
                      }}
                    />
                  ))}
                </div>
              </Field>

              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-950">Melhorar briefing com IA externa</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Copie o prompt, cole na sua IA preferida e depois traga o JSON gerado para preencher os campos automaticamente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyExternalPrompt}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-950 transition hover:border-slate-300 sm:w-auto"
                  >
                    {isPromptCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    {isPromptCopied ? "Copiado" : "Copiar prompt"}
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  <textarea
                    value={externalJson}
                    onChange={(event) => setExternalJson(event.target.value)}
                    rows={7}
                    placeholder={JSON.stringify(EXTERNAL_AI_JSON_TEMPLATE, null, 2)}
                    className={fieldClassName("resize-y rounded-2xl bg-white font-mono text-xs leading-5")}
                  />
                  <button
                    type="button"
                    onClick={applyExternalJson}
                    disabled={!externalJson.trim()}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Aplicar JSON no briefing
                  </button>
                </div>
              </section>

              <Field label="Objetivo do PDF" hint="Qual resultado o material deve entregar ao leitor?">
                <textarea value={form.objetivoDoPdf} onChange={(event) => updateForm("objetivoDoPdf", event.target.value)} rows={3} className={fieldClassName("resize-none")} />
              </Field>

              <Field label="Publico-alvo" hint="Quem vai ler? Inclua contexto, cargo, mercado ou nivel de maturidade.">
                <textarea value={form.publicoAlvo} onChange={(event) => updateForm("publicoAlvo", event.target.value)} rows={3} className={fieldClassName("resize-none")} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nivel">
                  <select value={form.nivelDoPublico} onChange={(event) => updateForm("nivelDoPublico", event.target.value as AudienceLevel)} className={fieldClassName("h-12 py-0 font-semibold")}>
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediario</option>
                    <option value="avancado">Avancado</option>
                  </select>
                </Field>

                <Field label="Tom de voz">
                  <select value={form.tomDeVoz} onChange={(event) => updateForm("tomDeVoz", event.target.value as VoiceTone)} className={fieldClassName("h-12 py-0 font-semibold")}>
                    <option value="direto">Direto</option>
                    <option value="educativo">Educativo</option>
                    <option value="premium">Premium</option>
                    <option value="agressivo">Agressivo</option>
                    <option value="tecnico">Tecnico</option>
                    <option value="simples">Simples</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Profundidade">
                  <select value={form.profundidade} onChange={(event) => updateForm("profundidade", event.target.value as DepthLevel)} className={fieldClassName("h-12 py-0 font-semibold")}>
                    <option value="resumido">Resumido</option>
                    <option value="medio">Medio</option>
                    <option value="detalhado">Detalhado</option>
                    <option value="premium">Premium</option>
                  </select>
                </Field>

                <Field label="Entrega">
                  <select value={form.tipoDeEntrega} onChange={(event) => updateForm("tipoDeEntrega", event.target.value as DeliveryType)} className={fieldClassName("h-12 py-0 font-semibold")}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="checkout">Checkout</option>
                    <option value="proposta">Proposta</option>
                    <option value="ebook">Ebook</option>
                    <option value="bonus">Bonus</option>
                    <option value="interno">Interno</option>
                  </select>
                </Field>
              </div>

              <Field label="Pontos obrigatorios" hint="Liste topicos, ofertas, objecoes, etapas ou exemplos que precisam entrar.">
                <textarea value={form.pontosObrigatorios} onChange={(event) => updateForm("pontosObrigatorios", event.target.value)} rows={4} className={fieldClassName("resize-none")} />
              </Field>

              <Field label="Briefing" hint="Descreva contexto, produto, mercado, promessa e restricoes.">
                <textarea value={form.briefing} onChange={(event) => updateForm("briefing", event.target.value)} rows={8} className={fieldClassName("resize-none")} />
              </Field>

              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</div> : null}

              {status ? (
                <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-800">
                  {isGenerating || isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {status}
                </div>
              ) : null}

              {pdf?.generatedWithMock ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  Usando dados mockados porque `GROQ_API_KEY` nao esta configurada.
                </div>
              ) : null}

              {pdf ? (
                <div className="space-y-4 border-t border-slate-200 pt-5">
                  <div>
                    <h2 className="text-base font-black text-slate-950">Editar conteudo</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Ajuste textos antes de exportar. As alteracoes ficam salvas neste navegador.</p>
                  </div>

                  <Field label="Titulo">
                    <input value={pdf.title} onChange={(event) => updatePdfDocument("title", event.target.value)} className={fieldClassName("h-12 py-0 font-semibold")} />
                  </Field>

                  <Field label="Subtitulo">
                    <textarea value={pdf.subtitle} onChange={(event) => updatePdfDocument("subtitle", event.target.value)} rows={2} className={fieldClassName("resize-none")} />
                  </Field>

                  <div className="space-y-3">
                    {pdf.pages.map((page, index) => (
                      <details key={`${page.type}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3" open={index === 0}>
                        <summary className="cursor-pointer text-sm font-black text-slate-950">
                          <span className="block break-words">Pagina {index + 1}: {page.title}</span>
                        </summary>
                        <div className="mt-3 space-y-3">
                          <input value={page.title} onChange={(event) => updatePdfPage(index, "title", event.target.value)} className={fieldClassName("h-10 rounded-xl py-0 font-semibold")} />
                          <textarea value={page.subtitle} onChange={(event) => updatePdfPage(index, "subtitle", event.target.value)} rows={2} className={fieldClassName("resize-none rounded-xl px-3 py-2 text-xs")} />
                          <textarea value={page.content} onChange={(event) => updatePdfPage(index, "content", event.target.value)} rows={4} className={fieldClassName("resize-none rounded-xl px-3 py-2 text-xs")} />

                          {(["items", "actionItems"] as const).map((listKey) =>
                            page[listKey]?.length ? (
                              <div key={listKey} className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{listKey === "items" ? "Itens" : "Acoes"}</p>
                                {page[listKey]?.slice(0, 5).map((item, itemIndex) => (
                                  <textarea
                                    key={`${listKey}-${itemIndex}`}
                                    value={item}
                                    onChange={(event) => updatePdfPageList(index, listKey, itemIndex, event.target.value)}
                                    rows={2}
                                    className={fieldClassName("resize-none rounded-xl px-3 py-2 text-xs")}
                                  />
                                ))}
                              </div>
                            ) : null,
                          )}

                          {page.cta ? <input value={page.cta} onChange={(event) => updatePdfPage(index, "cta", event.target.value)} className={fieldClassName("h-10 rounded-xl py-0 font-semibold")} /> : null}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="order-1 min-w-0 lg:order-2">
            <PdfPreview pdf={pdf} />
          </section>
        </div>

        <footer className="pb-2 text-center text-xs font-semibold text-slate-500 sm:pb-0">
          by Eight Digital.
        </footer>
      </div>
    </main>
  );
}
