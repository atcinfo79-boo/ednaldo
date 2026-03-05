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
- Logística: Entregas em 24h no Rio de Janeiro, frete sob consulta.

Regras de comportamento:
1. Se o usuário perguntar algo fora de construção, gentilmente traga de volta para o assunto da loja.
2. Mencione que a Ednaldo tem os melhores preços e qualidade do Rio.
3. Se a dúvida for muito complexa, ou se o cliente demonstrar interesse em comprar, orçar ou saber estoque, sugira falar com um vendedor no WhatsApp.
4. Responda sempre em Português do Brasil.
5. Você tem acesso à pesquisa do Google. Use-a sempre que precisar de informações técnicas atualizadas, especificações de produtos de marcas parceiras ou tendências de mercado para dar a melhor resposta possível ao cliente.`;

  // Ensure history alternates roles and doesn't have consecutive same roles
  const cleanHistory = history.filter((item, index) => {
    if (index === 0) return true;
    return item.role !== history[index - 1].role;
  });

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
      history: cleanHistory,
    });

    const result = await chat.sendMessage({ message });
    
    // Extract grounding URLs if available
    let responseText = result.text.replace(/\*/g, '');
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const urls = chunks
        .map(chunk => chunk.web?.uri)
        .filter(uri => uri)
        .slice(0, 3); // Limit to top 3 sources
      
      if (urls.length > 0) {
        responseText += "\n\nFontes pesquisadas:\n" + urls.join('\n');
      }
    }

    return responseText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, tive um problema técnico. Pode repetir ou nos chamar no WhatsApp? (21) 99818-7716";
  }
}

export async function getConversationSummary(history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  const prompt = `Com base na conversa acima, identifique exatamente qual material ou serviço o cliente está buscando ou tem dúvidas. 
  Responda APENAS com o nome do material ou serviço, de forma curta e direta (ex: "Cimento e Areia", "Pisos de Porcelanato", "Tintas para Parede"). 
  Não use frases completas, não use asteriscos, não use pontuação final.`;

  // Ensure history alternates roles for summary too
  const cleanHistory = history.filter((item, index) => {
    if (index === 0) return true;
    return item.role !== history[index - 1].role;
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...cleanHistory,
        { role: "user", parts: [{ text: prompt }] }
      ],
    });

    return response.text?.replace(/\*/g, '').trim() || "Materiais de construção";
  } catch (error) {
    console.error("Summary Error:", error);
    return "Materiais de construção";
  }
}

export async function analyzeImage(base64Data: string) {
  const model = "gemini-3-flash-preview";
  const prompt = "Aja como um especialista em materiais de construção. Identifique todos os produtos e quantidades nesta imagem de lista de materiais. Retorne APENAS um array JSON de strings, exemplo: [\"10 sacos de cimento\", \"5 latas de tinta\"]. Não inclua explicações, apenas o JSON puro.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as string[];
    }
    return [];
  } catch (error) {
    console.error("Image Analysis Error:", error);
    return [];
  }
}
