import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
