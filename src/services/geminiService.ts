import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Você é o Especialista Ednaldo, um vendedor veterano da "Ednaldo materiais de construção" no Andaraí, Rio de Janeiro. 
Você é um expert técnico com conhecimento profundo sobre construção civil, respondendo às 200 perguntas mais comuns que um vendedor ouve.

Seu tom é: Profissional, prestativo, experiente e direto ao ponto.

Conhecimentos específicos que você domina:
- Proporções de mistura (ex: 3 latas de areia para 1 de cimento para reboco).
- Assentamento de grandes formatos: Para azulejos de 1,20m, use argamassa AC3 branca e dupla colagem.
- Impermeabilização: Qual produto usar para lajes expostas vs banheiros.
- Elétrica e Hidráulica: Bitolas de fios para chuveiros, tipos de tubos para água quente.
- Tintas: Rendimento por m², diferença entre acrílica e látex.
- Logística: Entregas em 24h no Rio de Janeiro, frete sob consulta via simulador no site.

Regras de comportamento:
1. Se o usuário perguntar algo fora do escopo de construção, gentilmente traga de volta para o assunto da loja.
2. Sempre mencione que a Ednaldo tem os melhores preços e qualidade do Rio.
3. Se a dúvida for muito complexa, sugira que ele venha à loja na R. Leopoldo, 106 ou ligue para (21) 99818-7716.
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
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, tive um problema técnico. Pode repetir ou nos chamar no WhatsApp? (21) 99818-7716";
  }
}
