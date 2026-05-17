# PDFEasy

PDFEasy é uma aplicação Next.js para gerar conteúdo estruturado com IA, revisar o material gerado e exportar PDFs a partir de templates fixos em React/Tailwind.

O projeto foi pensado para criadores, agências, consultores e pequenos negócios que precisam criar guias rápidos, checklists, mini ebooks, propostas, bônus digitais e materiais internos sem começar do zero.

## Funcionalidades

- Geração de conteúdo estruturado com Groq.
- Conteúdo mockado quando `GROQ_API_KEY` não está configurada.
- Exportação de PDF com Playwright.
- Edição de títulos, subtítulos, conteúdo das páginas, itens e CTAs antes de exportar.
- Salvamento automático do rascunho no navegador com `localStorage`.
- Interface responsiva para desktop e celular.
- Preview do PDF com escala automática em telas pequenas.
- Assistente para briefing com IA externa:
  - copia um prompt com modelo JSON;
  - permite colar o JSON retornado por outra IA;
  - preenche automaticamente os campos do PDFEasy.
- Validação de overflow antes de baixar o PDF.
- Rodapé com a marca `by Eight Digital.`

## Tecnologias

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Zod
- Groq API
- Playwright
- Lucide React

## Como Rodar Localmente

Instale as dependências:

```bash
npm install
```

Crie o arquivo de ambiente local:

```bash
cp .env.example .env.local
```

Se preferir, crie `.env.local` manualmente:

```bash
GROQ_API_KEY=sua_chave_da_groq_aqui
GROQ_MODEL=llama-3.3-70b-versatile
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `GROQ_API_KEY` | Não | Chave da Groq usada para gerar conteúdo real com IA. Se não estiver configurada, o PDFEasy usa conteúdo mockado. |
| `GROQ_MODEL` | Não | Modelo da Groq. O padrão é `llama-3.3-70b-versatile`. |

Nunca envie `.env.local` ou chaves reais para o GitHub.

## Scripts

Inicia o ambiente de desenvolvimento:

```bash
npm run dev
```

Gera o build de produção:

```bash
npm run build
```

Executa o build de produção localmente:

```bash
npm run start
```

Roda o lint do Next.js:

```bash
npm run lint
```

Valida os tipos TypeScript sem gerar arquivos:

```bash
npm run typecheck
```

## Como Usar

1. Escolha o tipo de PDF, formato, orientação, cor, tom de voz, profundidade e tipo de entrega.
2. Preencha objetivo, público-alvo, pontos obrigatórios e briefing.
3. Opcionalmente, use a seção **Melhorar briefing com IA externa**:
   - clique em **Copiar prompt**;
   - cole o prompt na sua IA preferida;
   - copie o JSON retornado;
   - cole no PDFEasy;
   - clique em **Aplicar JSON no briefing**.
4. Clique em **Gerar preview**.
5. Revise e edite o conteúdo gerado.
6. Clique em **Exportar PDF**.

## Modelo JSON Para IA Externa

O PDFEasy consegue preencher o briefing a partir de um JSON neste formato:

```json
{
  "objetivoDoPdf": "Qual resultado o leitor deve conseguir depois de ler o PDF?",
  "publicoAlvo": "Quem vai ler? Cargo, contexto, dores e nivel de conhecimento.",
  "nivelDoPublico": "iniciante | intermediario | avancado",
  "tomDeVoz": "direto | educativo | premium | agressivo | tecnico | simples",
  "tipoDeEntrega": "whatsapp | checkout | proposta | ebook | bonus | interno",
  "promessaPrincipal": "A transformacao central do material.",
  "contextoDoNegocio": "Produto, servico, mercado, oferta, preco ou momento atual.",
  "pontosObrigatorios": [
    "Topico, etapa, oferta ou objecao que precisa aparecer",
    "Exemplo real que deve ser citado",
    "CTA desejado no final"
  ],
  "restricoes": [
    "O que evitar",
    "Termos que nao devem aparecer",
    "Limites de promessa ou linguagem"
  ],
  "exemplos": [
    "Casos, frases, mensagens, frameworks ou ideias que devem inspirar o PDF"
  ]
}
```

## Exportação de PDF

A rota de exportação valida o documento com Zod e renderiza o HTML no servidor a partir de JSON estruturado. Ela não confia em HTML arbitrário vindo do navegador.

Antes de devolver o arquivo, o PDFEasy verifica se alguma página `.pdf-sheet` estourou o limite visual. Se houver conteúdo demais em uma página, a exportação falha com uma mensagem pedindo para editar ou regenerar com menos detalhes.

## Estrutura do Projeto

```text
app/
  api/
    export-pdf/
    generate/
  globals.css
  layout.tsx
  page.tsx
components/
  Field.tsx
  PdfBuilder.tsx
  PdfPreview.tsx
  WhatsAppGuideTemplate.tsx
lib/
  filename.ts
  formats.ts
  groq.ts
  mock.ts
  schema.ts
  themes.ts
```

## Deploy

O projeto pode ser publicado como uma aplicação Next.js comum. Garanta que o ambiente de deploy suporte:

- runtime Node.js para as rotas de API;
- execução do Playwright/Chromium para exportação de PDF;
- variável `GROQ_API_KEY`, caso você queira geração real com IA.

## Segurança

- Não suba chaves de API para o GitHub.
- Mantenha `.env.local` apenas no ambiente local.
- Rotacione qualquer chave que tenha sido compartilhada ou commitada por engano.
- A exportação atual renderiza o PDF a partir de JSON validado, em vez de confiar em HTML enviado pelo navegador.

## Créditos

by Eight Digital.
