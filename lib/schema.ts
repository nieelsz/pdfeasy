import { z } from "zod";

export const pdfTypes = ["guia_rapido", "checklist", "mini_ebook", "proposta"] as const;
export const pdfFormats = ["A4", "1080x1920", "1080x1080"] as const;
export const pdfOrientations = ["vertical", "horizontal"] as const;
export const pdfPageTypes = ["cover", "text", "checklist", "steps", "benefits", "cta"] as const;
export const audienceLevels = ["iniciante", "intermediario", "avancado"] as const;
export const voiceTones = ["direto", "educativo", "premium", "agressivo", "tecnico", "simples"] as const;
export const depthLevels = ["resumido", "medio", "detalhado", "premium"] as const;
export const deliveryTypes = ["whatsapp", "checkout", "proposta", "ebook", "bonus", "interno"] as const;

export const generatePdfInputSchema = z.object({
  type: z.enum(pdfTypes),
  format: z.enum(pdfFormats),
  orientation: z.enum(pdfOrientations),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor principal válida."),
  briefing: z.string().min(10, "Descreva melhor o briefing.").max(4000, "O briefing está muito longo."),
  objetivoDoPdf: z.string().max(1000).optional().default(""),
  publicoAlvo: z.string().max(1000).optional().default(""),
  nivelDoPublico: z.enum(audienceLevels).optional().default("iniciante"),
  tomDeVoz: z.enum(voiceTones).optional().default("direto"),
  pontosObrigatorios: z.string().max(2500).optional().default(""),
  quantidadeDePaginas: z.coerce.number().int().min(5).max(8).optional().default(6),
  profundidade: z.enum(depthLevels).optional().default("detalhado"),
  tipoDeEntrega: z.enum(deliveryTypes).optional().default("ebook"),
});

export const pdfStepSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  action: z.string().min(1).optional(),
  example: z.string().min(1).optional(),
  why: z.string().min(1).optional(),
});

export const pdfPageSchema = z.object({
  type: z.enum(pdfPageTypes),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  content: z.string().min(1),
  items: z.array(z.string().min(1)).min(1).optional(),
  steps: z.array(pdfStepSchema).min(3).optional(),
  tips: z.array(z.string().min(1)).min(1).optional(),
  warnings: z.array(z.string().min(1)).min(1).optional(),
  examples: z.array(z.string().min(1)).min(1).optional(),
  commonMistakes: z.array(z.string().min(1)).min(1).optional(),
  actionItems: z.array(z.string().min(1)).min(1).optional(),
  cta: z.string().min(1).optional(),
});

export const pdfDocumentSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  type: z.enum(pdfTypes),
  format: z.enum(pdfFormats),
  orientation: z.enum(pdfOrientations),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  pages: z.array(pdfPageSchema).min(3).max(8),
});

export type PdfType = (typeof pdfTypes)[number];
export type PdfFormat = (typeof pdfFormats)[number];
export type PdfOrientation = (typeof pdfOrientations)[number];
export type PdfPageType = (typeof pdfPageTypes)[number];
export type AudienceLevel = (typeof audienceLevels)[number];
export type VoiceTone = (typeof voiceTones)[number];
export type DepthLevel = (typeof depthLevels)[number];
export type DeliveryType = (typeof deliveryTypes)[number];

export type PdfStep = z.infer<typeof pdfStepSchema>;
export type PdfPage = z.infer<typeof pdfPageSchema>;
export type PdfDocument = z.infer<typeof pdfDocumentSchema>;
export type GeneratePdfInput = z.infer<typeof generatePdfInputSchema>;

export type GeneratedPdf = PdfDocument & {
  generatedWithMock: boolean;
};
