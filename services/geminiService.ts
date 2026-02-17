import { GoogleGenAI, Type } from "@google/genai";
import { ClockifyData } from "../types";

/**
 * Processa o relatório CSV do Clockify diretamente no frontend usando Gemini.
 */
export async function parseClockifyReport(fileBase64: string, _mimeType: string): Promise<ClockifyData[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Extração do texto do base64
    const base64Data = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const csvText = new TextDecoder('utf-8').decode(bytes);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um assistente financeiro especializado em Clockify. 
      Analise o relatório CSV abaixo.
      Extraia o nome de cada usuário e sua duração total.
      Converta a duração para tokens (taxa: 1 hora = 0.4 TK).
      Ignore linhas de cabeçalho ou totais gerais.
      
      CSV:
      ${csvText}
      
      Retorne um array JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              user: { type: Type.STRING, description: "Nome do usuário conforme consta no Clockify" },
              duration: { type: Type.STRING, description: "Duração formatada (ex: 08:30:00)" },
              tokens: { type: Type.NUMBER, description: "Valor em tokens (Horas decimais * 0.4)" },
            },
            required: ["user", "duration", "tokens"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("A IA não retornou dados.");
    
    return JSON.parse(text.trim());
  } catch (error: any) {
    console.error("Erro no processamento Gemini:", error);
    throw new Error(error.message || "Erro ao processar arquivo com IA.");
  }
}