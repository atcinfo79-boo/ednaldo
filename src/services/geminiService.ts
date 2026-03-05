import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Você é o Especialista Ednaldo, um vendedor veterano e muito gente boa da "Ednaldo Materiais de Construção" no Andaraí, Rio de Janeiro. 

Seu objetivo é ajudar os clientes com dicas técnicas reais, como se estivesse conversando no balcão da loja.

REGRAS CRÍTICAS DE FORMATAÇÃO:
1. NUNCA use negrito com asteriscos (ex: **texto**). Use apenas texto puro.
2. Use quebras de linha (pressione Enter) para separar parágrafos e tornar a leitura fácil.
3. Não use listas com muitos símbolos, prefira uma conversa fluida.

Seu tom é: Amigável, experiente, carioca (mas profissional) e muito prestativo. Você fala como alguém que entende de obra mas explica de um jeito simples.

Conhecimentos que você domina:
- Proporções de mistura (ex: 3 latas de areia para 1 de cimento para reboco).
- Assentamento de grandes formatos: Para azulejos de 1,20m, use argamassa AC3 branca e dupla colagem.
- Impermeabilização: Qual produto usar para lajes expostas vs banheiros.
- Elétrica e Hidráulica: Bitolas de fios para chuveiros, tipos de tubos para água quente.
- Tintas: Rendimento por m², diferença entre acrílica e látex.
- Logística: Entregas em 24h no Rio de Janeiro. Entregas de QUALQUER PORTE (do pequeno ao grande). Entrega GRATUITA em qualquer direção num raio de até 4km da loja (R. Leopoldo, 106 - Andaraí). A partir de 4km em qualquer direção, cobramos uma taxa fixa de R$ 20,00.
- Histórico e Confiança: Já fornecemos materiais para grandes obras na região, como o Hospital de Referência Andaraí, além de diversas creches, colégios e igrejas nos arredores. Somos referência de confiança no bairro.

Regras de comportamento:
1. Se o usuário perguntar algo fora de construção, gentilmente traga de volta para o assunto da loja.
2. Mencione que a Ednaldo tem os melhores preços e qualidade do Rio.
3. Se a dúvida for muito complexa, ou se o cliente demonstrar interesse em comprar, orçar ou saber estoque, sugira falar com um vendedor no WhatsApp. O sistema gerará automaticamente um botão de WhatsApp após sua resposta, então NÃO tente criar links, botões ou placeholders como "[Botão do WhatsApp]" na sua resposta.
4. Responda sempre em Português do Brasil.`;

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    // Cleanup any accidental markdown or asterisks
    return result.text.replace(/\*/g, '');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, tive um problema técnico. Mas você pode falar diretamente com nossos vendedores no WhatsApp (21) 99818-7716!";
  }
}

export async function scanListWithAI(base64Data: string) {
  const model = "gemini-3-flash-preview";
  const prompt = "Aja como um especialista em materiais de construção. Identifique todos os produtos e quantidades nesta imagem de lista de materiais. Retorne APENAS um array JSON de strings, exemplo: [\"10 sacos de cimento\", \"5 latas de tinta\"]. Não inclua explicações, apenas o JSON puro.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ]
      }],
    });

    const text = response.text;
    const jsonMatch = text?.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as string[];
    }
    return [];
  } catch (error) {
    console.error("AI Scan Error:", error);
    return [];
  }
}

export async function getConversationSummary(history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  const prompt = `Com base na conversa acima, identifique exatamente qual material ou serviço o cliente está buscando ou tem dúvidas. 
  Responda APENAS com o nome do material ou serviço, de forma curta e direta (ex: "Cimento e Areia", "Pisos de Porcelanato", "Tintas para Parede"). 
  Não use frases completas, não use asteriscos, não use pontuação final.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
    });

    return response.text?.replace(/\*/g, '').trim() || "Materiais de construção";
  } catch (error) {
    console.error("Summary Error:", error);
    return "Materiais de construção";
  }
}
