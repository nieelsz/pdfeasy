import { z } from "zod";
import { createMockPdf } from "@/lib/mock";
import { pdfDocumentSchema } from "@/lib/schema";
import type { GeneratePdfInput, GeneratedPdf, PdfDocument } from "@/lib/schema";

const groqResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    }),
  ),
});

const SYSTEM_PROMPT = `
Você é um especialista em criar PDFs comerciais, guias rápidos, checklists, bônus digitais, propostas e materiais educativos premium.

Sua função NÃO é criar layout.
Sua função é gerar conteúdo estruturado, profundo, prático e útil em JSON.

O usuário vai informar um briefing.
Você deve transformar esse briefing em um conteúdo completo para PDF.

Regras:
- Retorne somente JSON válido.
- Não use markdown.
- Não explique nada fora do JSON.
- Nunca gere conteúdo genérico.
- Nunca use frases vagas.
- Cada página deve ter um objetivo claro.
- Cada página deve ter conteúdo útil o suficiente para o leitor aplicar.
- Sempre escreva para o público informado no briefing.
- Se o briefing estiver incompleto, complete com boas práticas realistas.
- O conteúdo deve ter cara de material premium, não de resumo gratuito.
- Use linguagem simples, direta e prática.
- Gere entre 5 e 8 páginas.
- A primeira página deve ser cover.
- A última página deve ser cta.
- Cada página de conteúdo deve ter explicação, passos, exemplos ou checklist.

Evite frases como:
"Organize seus arquivos"
"Siga o passo a passo"
"Faça backup"
"Tenha atenção"
"Verifique tudo"

Em vez disso, detalhe:
O que fazer, como fazer, por que fazer e quais erros evitar.

Regras técnicas adicionais:
- Preserve exatamente type, format, orientation e primaryColor recebidos.
- Não inclua layout, design, HTML, CSS, classes, fontes, cores, grids ou instruções visuais no conteúdo.
- Use somente os campos permitidos pelo schema informado na mensagem do usuário.
- Os tipos de página permitidos são: cover, text, checklist, steps, benefits, cta.
- Quando usar steps, cada passo deve trazer title, content, action, example e why sempre que possível.
- Quando usar checklist, gere pelo menos 5 itens específicos, verificáveis e acionáveis.
- Inclua tips, warnings, examples, commonMistakes ou actionItems quando isso deixar o material mais aplicável.
`.trim();

const BANNED_GENERIC_PHRASES = [
  "organize seus arquivos",
  "siga o passo a passo",
  "faça backup",
  "tenha atenção",
  "verifique tudo",
];

function buildUserPrompt(input: GeneratePdfInput) {
  const depthInstruction =
    input.profundidade === "premium"
      ? "Profundidade premium: cada página deve ter explicações mais completas, exemplos práticos, alertas, erros comuns e ações recomendadas. Evite respostas curtas."
      : input.profundidade === "detalhado"
        ? "Profundidade detalhada: use explicações completas, exemplos e ações práticas em quase todas as páginas."
        : input.profundidade === "medio"
          ? "Profundidade média: seja direto, mas inclua exemplos e checklists suficientes para aplicação."
          : "Profundidade resumida: seja conciso, mantendo instruções práticas e específicas.";

  return `
Gere um JSON estruturado de conteúdo para um PDF premium.

Entrada do usuário:
- type: ${input.type}
- format: ${input.format}
- orientation: ${input.orientation}
- primaryColor: ${input.primaryColor}
- objetivoDoPdf: ${input.objetivoDoPdf || "não informado"}
- publicoAlvo: ${input.publicoAlvo || "não informado"}
- nivelDoPublico: ${input.nivelDoPublico}
- tomDeVoz: ${input.tomDeVoz}
- pontosObrigatorios: ${input.pontosObrigatorios || "não informado"}
- quantidadeDePaginas: ${input.quantidadeDePaginas}
- profundidade: ${input.profundidade}
- tipoDeEntrega: ${input.tipoDeEntrega}
- briefing: ${input.briefing}

Retorne exatamente este formato:
{
  "title": "string específica e forte",
  "subtitle": "string com promessa clara e concreta",
  "type": "${input.type}",
  "format": "${input.format}",
  "orientation": "${input.orientation}",
  "primaryColor": "${input.primaryColor}",
  "pages": [
    {
      "type": "cover | text | checklist | steps | benefits | cta",
      "title": "string",
      "subtitle": "string",
      "content": "explicação útil, específica e aplicável",
      "items": ["itens detalhados quando aplicável"],
      "steps": [
        {
          "title": "nome do passo",
          "content": "o que fazer e como fazer",
          "action": "ação concreta",
          "example": "exemplo prático",
          "why": "por que isso importa"
        }
      ],
      "tips": ["dicas específicas quando fizer sentido"],
      "warnings": ["alertas concretos quando fizer sentido"],
      "examples": ["exemplos práticos adaptados ao briefing"],
      "commonMistakes": ["erros comuns específicos"],
      "actionItems": ["ações finais específicas"],
      "cta": "chamada para ação objetiva"
    }
  ]
}

Reforce a qualidade:
- Gere exatamente ${input.quantidadeDePaginas} páginas.
- A primeira página deve ser cover.
- A última página deve ser cta.
- Cada página de conteúdo deve ter explicação, passos, exemplos ou checklist.
- Cada página deve ter um objetivo claro.
- Cada item de checklist deve ser específico, acionável e verificável.
- Cada passo deve explicar o que fazer, como fazer, por que fazer e quais erros evitar.
- Se o briefing estiver incompleto, complete com boas práticas realistas.
- Escreva em português do Brasil.
- Não mencione IA, Groq, template, layout, React, CSS, cor ou PDFEasy dentro do conteúdo das pages.
- Não use markdown.
- Não escreva texto fora do JSON.
- Use especialmente o campo profundidade para calibrar o nível de detalhe.
- ${depthInstruction}
- Adapte exemplos, termos e complexidade ao nivelDoPublico.
- Respeite o tomDeVoz escolhido.
- Respeite todos os pontosObrigatorios.
- Considere o tipoDeEntrega para definir CTA e ação final.
`.trim();
}

function buildRepairPrompt(rawContent: string, validationError: string, input: GeneratePdfInput) {
  return `
A resposta anterior não é um JSON válido para o schema do PDFEasy ou não respeitou o contrato de qualidade.

Erro de validação:
${validationError}

Resposta anterior:
${rawContent}

Briefing original:
${input.briefing}

Campos adicionais originais:
- objetivoDoPdf: ${input.objetivoDoPdf || "não informado"}
- publicoAlvo: ${input.publicoAlvo || "não informado"}
- nivelDoPublico: ${input.nivelDoPublico}
- tomDeVoz: ${input.tomDeVoz}
- pontosObrigatorios: ${input.pontosObrigatorios || "não informado"}
- quantidadeDePaginas: ${input.quantidadeDePaginas}
- profundidade: ${input.profundidade}
- tipoDeEntrega: ${input.tipoDeEntrega}

Corrija e retorne SOMENTE JSON válido, sem markdown e sem texto fora do JSON.

Mantenha exatamente:
- type: ${input.type}
- format: ${input.format}
- orientation: ${input.orientation}
- primaryColor: ${input.primaryColor}

Campos permitidos no topo:
title, subtitle, type, format, orientation, primaryColor, pages.

Campos permitidos em cada page:
type, title, subtitle, content, items, steps, tips, warnings, examples, commonMistakes, actionItems, cta.

Campos permitidos em cada step:
title, content, action, example, why.

Remova frases vagas e detalhe o que fazer, como fazer, por que fazer e quais erros evitar.
Gere exatamente ${input.quantidadeDePaginas} páginas.
Se profundidade for "premium", cada página deve ter explicações mais completas, exemplos práticos, alertas e ações recomendadas.
`.trim();
}

function parseJsonObject(rawContent: string) {
  const trimmed = rawContent.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("A Groq não retornou um JSON válido.");
  }
}

function normalizeDocument(document: PdfDocument, input: GeneratePdfInput): PdfDocument {
  return {
    ...document,
    type: input.type,
    format: input.format,
    orientation: input.orientation,
    primaryColor: input.primaryColor,
  };
}

function collectText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectText);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectText);

  return [];
}

function assertContentQuality(document: PdfDocument, input: GeneratePdfInput) {
  const allText = collectText(document).map((text) => text.toLowerCase());
  const matchedPhrase = BANNED_GENERIC_PHRASES.find((phrase) => allText.some((text) => text.includes(phrase)));

  if (matchedPhrase) {
    throw new Error(`Conteúdo genérico detectado: "${matchedPhrase}".`);
  }

  if (document.pages.length !== input.quantidadeDePaginas) {
    throw new Error(`O PDF precisa ter exatamente ${input.quantidadeDePaginas} páginas.`);
  }

  if (document.pages[0]?.type !== "cover") {
    throw new Error("A primeira página precisa ser do tipo cover.");
  }

  if (document.pages[document.pages.length - 1]?.type !== "cta") {
    throw new Error("A última página precisa ser do tipo cta.");
  }

  for (const page of document.pages) {
    const hasStructuredContent =
      page.items?.length ||
      page.steps?.length ||
      page.tips?.length ||
      page.warnings?.length ||
      page.examples?.length ||
      page.commonMistakes?.length ||
      page.actionItems?.length;

    if (page.type !== "cover" && !hasStructuredContent) {
      throw new Error(`A página "${page.title}" precisa ter passos, exemplos, checklist, dicas, alertas ou ações.`);
    }

    if (page.type === "checklist" && (!page.items || page.items.length < 5)) {
      throw new Error(`A página checklist "${page.title}" precisa ter pelo menos 5 itens acionáveis.`);
    }

    if (page.type === "steps" && (!page.steps || page.steps.length < 3)) {
      throw new Error(`A página de passos "${page.title}" precisa ter pelo menos 3 passos detalhados.`);
    }
  }
}

async function callGroq(apiKey: string, messages: Array<{ role: "system" | "user"; content: string }>) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    if (response.status === 429 || message.toLowerCase().includes("rate_limit")) {
      throw new Error("A Groq atingiu o limite de uso temporário. Tente novamente em alguns minutos.");
    }

    throw new Error("A Groq recusou a geração. Verifique a chave, o modelo configurado e tente novamente.");
  }

  const payload = groqResponseSchema.parse(await response.json());
  const content = payload.choices[0]?.message.content;

  if (!content) {
    throw new Error("A Groq retornou uma resposta vazia.");
  }

  return content;
}

function validateGeneratedDocument(rawContent: string, input: GeneratePdfInput) {
  const parsed = parseJsonObject(rawContent);
  const document = pdfDocumentSchema.parse(parsed);
  const normalized = normalizeDocument(document, input);
  assertContentQuality(normalized, input);

  return normalized;
}

export async function generatePdfContent(input: GeneratePdfInput): Promise<GeneratedPdf> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return createMockPdf(input);
  }

  const firstRawContent = await callGroq(apiKey, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(input) },
  ]);

  try {
    const document = validateGeneratedDocument(firstRawContent, input);
    return { ...document, generatedWithMock: false };
  } catch (firstError) {
    const validationError = firstError instanceof Error ? firstError.message : "JSON inválido.";

    try {
      const repairedRawContent = await callGroq(apiKey, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildRepairPrompt(firstRawContent, validationError, input) },
      ]);
      const document = validateGeneratedDocument(repairedRawContent, input);

      return { ...document, generatedWithMock: false };
    } catch (repairError) {
      const repairMessage = repairError instanceof Error ? repairError.message : "JSON inválido.";
      throw new Error(`A IA ainda retornou conteúdo fora do padrão esperado: ${repairMessage}`);
    }
  }
}
