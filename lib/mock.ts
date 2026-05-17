import type { GeneratePdfInput, GeneratedPdf } from "@/lib/schema";

export function createMockPdf(input: GeneratePdfInput): GeneratedPdf {
  const allPages: GeneratedPdf["pages"] = [
    {
      type: "cover",
      title: "Guia rápido para vender mais pelo WhatsApp",
      subtitle: "Atendimento, oferta e follow-up em uma sequência simples para pequenos negócios.",
      content:
        "Use este material para padronizar mensagens, responder leads com mais clareza e conduzir cada conversa para um próximo passo concreto, sem parecer insistente.",
      examples: [
        "Exemplo de objetivo: transformar pedidos de preço em conversas qualificadas.",
        "Exemplo de público: lojistas, prestadores de serviço e pequenos times comerciais.",
      ],
      actionItems: ["Escolha uma conversa recente para aplicar o roteiro ainda hoje."],
    },
    {
      type: "text",
      title: "Diagnóstico rápido da conversa",
      subtitle: "Antes de vender, descubra o contexto que muda a abordagem.",
      content:
        "A maioria das conversas trava porque a oferta aparece antes da necessidade estar clara. Faça perguntas curtas para entender problema, urgência e critério de decisão antes de enviar preço, catálogo ou link de pagamento.",
      items: [
        "Pergunte qual resultado a pessoa quer alcançar antes de apresentar a solução.",
        "Identifique prazo de decisão: hoje, esta semana ou apenas pesquisando.",
        "Descubra se existe uma objeção explícita, como preço, confiança, prazo ou comparação com concorrente.",
        "Registre a resposta principal em uma etiqueta ou nota para personalizar o follow-up.",
        "Responda com blocos de até três linhas para não transformar a conversa em texto longo.",
      ],
      tips: ["Use uma pergunta por mensagem. Duas ou três perguntas juntas reduzem a taxa de resposta."],
      warnings: ["Não envie tabela de preço antes de entender o que a pessoa está tentando resolver."],
    },
    {
      type: "steps",
      title: "Roteiro de atendimento",
      subtitle: "Três movimentos para sair do improviso e conduzir a venda.",
      content: "A sequência abaixo ajuda a manter a conversa objetiva sem perder o tom humano.",
      steps: [
        {
          title: "Abra com contexto",
          content: "Cumprimente pelo nome, retome o interesse da pessoa e faça uma pergunta simples sobre o objetivo dela.",
          action: "Envie uma pergunta que conecte o interesse do lead ao problema que ele quer resolver.",
          example: "Oi, Ana. Vi que você quer melhorar o atendimento pelo WhatsApp. Hoje o maior problema é demora na resposta ou falta de conversão?",
          why: "A abertura contextual mostra atenção e evita uma resposta genérica que parece automática.",
        },
        {
          title: "Apresente a oferta em blocos",
          content: "Explique o benefício central, o que está incluso e o próximo passo em mensagens separadas.",
          action: "Use uma mensagem para benefício, outra para prova e outra para convite de decisão.",
          example: "Isso resolve o atraso nas respostas porque inclui um roteiro pronto. Quer que eu te envie a opção mais rápida de implementar?",
          why: "Blocos curtos são mais fáceis de ler no celular e reduzem abandono da conversa.",
        },
        {
          title: "Faça follow-up com motivo",
          content: "Retome a necessidade citada e ofereça uma decisão simples, em vez de perguntar apenas se a pessoa viu.",
          action: "Depois de 24h, envie uma mensagem conectada ao problema ou prazo mencionado.",
          example: "Oi, Ana. Como você comentou que precisa organizar isso ainda esta semana, posso te mandar a opção mais rápida de implementar?",
          why: "Follow-up com contexto parece ajuda; follow-up vazio parece cobrança.",
        },
      ],
      commonMistakes: ["Perguntar 'alguma novidade?' sem acrescentar valor.", "Enviar áudio longo sem resumo escrito."],
    },
    {
      type: "checklist",
      title: "Checklist antes de enviar",
      subtitle: "Use esta lista para revisar cada conversa importante em menos de dois minutos.",
      content: "Marque os itens abaixo antes de enviar proposta, preço ou link de pagamento.",
      items: [
        "A primeira mensagem cita o interesse real do lead, não apenas um cumprimento genérico.",
        "Existe uma pergunta objetiva para descobrir necessidade, prazo ou objeção.",
        "A oferta cabe em até cinco linhas e começa pelo benefício, não pela lista de características.",
        "Há uma prova de confiança pronta, como depoimento, mini case ou print autorizado.",
        "O próximo passo está claro: responder uma pergunta, escolher uma opção ou confirmar um horário.",
        "O follow-up de 24h retoma uma informação que o lead já trouxe na conversa.",
      ],
      warnings: ["Se a pessoa ainda não explicou o problema, adie o envio de preço por mais uma pergunta."],
      actionItems: ["Salve este checklist como nota fixa no atendimento do time."],
    },
    {
      type: "benefits",
      title: "Boas práticas que aumentam resposta",
      subtitle: "Pequenos ajustes que tornam a conversa mais clara e menos cansativa.",
      content:
        "O objetivo não é escrever mais; é escrever com mais precisão. Mensagens curtas, contexto explícito e uma decisão por vez ajudam o lead a avançar sem esforço.",
      items: [
        "Troque 'temos várias opções' por 'pela sua necessidade, eu começaria por esta opção'.",
        "Troque 'qualquer dúvida estou à disposição' por 'quer que eu compare as duas opções para você decidir hoje?'.",
        "Troque textos longos por sequência de três mensagens curtas com benefício, prova e próximo passo.",
        "Use prazos reais quando existirem: entrega, agenda, lote, bônus ou validade da proposta.",
        "Registre objeções frequentes para criar respostas prontas sem perder personalização.",
      ],
      examples: [
        "Mensagem ruim: Segue catálogo, veja com atenção.",
        "Mensagem melhor: Separei as 3 opções mais vendidas para quem quer resolver isso sem aumentar o orçamento.",
      ],
      commonMistakes: ["Responder rápido, mas sem clareza.", "Mandar muitas opções e transferir toda a decisão para o lead."],
    },
    {
      type: "text",
      title: "Provas que reduzem objeção",
      subtitle: "Use confiança antes de pedir decisão.",
      content:
        "Antes de cobrar uma resposta, mostre uma prova simples de que sua solução funciona para alguém parecido com o lead. Isso reduz insegurança e deixa a conversa mais concreta.",
      examples: ["Envie um mini case de duas linhas com problema, solução e resultado.", "Use um print autorizado apenas quando ele provar uma objeção específica."],
      warnings: ["Não envie prints soltos sem explicar por que aquilo importa para a decisão do lead."],
    },
    {
      type: "text",
      title: "Mensagens prontas para adaptar",
      subtitle: "Modelos curtos para responder sem soar automático.",
      content:
        "Use os modelos como ponto de partida e personalize pelo produto perguntado, prazo citado ou objeção apresentada pelo lead.",
      items: [
        "Abertura: Vi que você quer resolver [situação]. Hoje o maior bloqueio é prazo, preço ou escolha da opção certa?",
        "Oferta: Pela sua necessidade, eu começaria por esta opção porque ela resolve [ponto principal] sem exigir [barreira].",
        "Follow-up: Como você comentou que precisa decidir até [prazo], posso te mandar a comparação entre as duas opções?",
        "Objeção: Faz sentido olhar preço. Para comparar direito, vale considerar também [critério que muda a decisão].",
        "Fechamento: Quer que eu deixe separado para hoje ou prefere que eu te envie uma alternativa mais econômica?",
      ],
    },
    {
      type: "cta",
      title: "Plano de ação para hoje",
      subtitle: "Aplique o guia em uma conversa real antes de criar novos materiais.",
      content:
        "Escolha um lead que pediu informações nos últimos sete dias. Reescreva a primeira resposta, simplifique a oferta e programe um follow-up com contexto. O ganho vem da repetição do processo.",
      actionItems: [
        "Selecione uma conversa recente com potencial de venda.",
        "Identifique a necessidade principal mencionada pelo lead.",
        "Reescreva a próxima mensagem com benefício, prova e pergunta objetiva.",
        "Agende um follow-up de 24h conectado ao prazo ou objeção citada.",
        "Salve a versão final como modelo para futuras conversas parecidas.",
      ],
      cta: "Aplicar roteiro em uma conversa",
    },
  ];
  const requestedPages = Math.min(8, Math.max(5, input.quantidadeDePaginas ?? 6));
  const pages = [allPages[0], ...allPages.slice(1, requestedPages - 1), allPages[allPages.length - 1]];

  return {
    title: "Guia rápido para vender mais pelo WhatsApp",
    subtitle: "Um roteiro prático para transformar conversas soltas em oportunidades comerciais reais.",
    type: input.type,
    format: input.format,
    orientation: input.orientation,
    primaryColor: input.primaryColor,
    pages,
    generatedWithMock: true,
  };
}
