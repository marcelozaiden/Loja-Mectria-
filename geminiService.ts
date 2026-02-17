
import { GoogleGenAI, Type } from "@google/genai";
import { ClockifyData } from "../types";

/**
 * Processa o relatório CSV do Clockify diretamente no frontend usando Gemini.
 * Garante que a conversão de horas (1h = 0.4 TK) seja sempre arredondada para cima para o próximo inteiro.
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
      contents: `Você é um assistente financeiro da Mectria. 
      Analise o relatório CSV do Clockify abaixo.
      Extraia: Nome do Usuário, Duração Total (HH:MM:SS).
      
      REGRA DE CONVERSÃO:
      1. Converta a duração total para horas decimais.
      2. Multiplique por 0.4 para obter os tokens.
      3. ARREDONDE SEMPRE PARA CIMA (CEIL) para o número inteiro mais próximo.
         Exemplo: 0.1 tokens -> 1 token. 10.01 tokens -> 11 tokens.
      
      Retorne APENAS um array JSON de objetos. Ignore cabeçalhos e totais do CSV.
      
      CSV:
      ${csvText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              user: { type: Type.STRING, description: "Nome exato do usuário no Clockify" },
              duration: { type: Type.STRING, description: "Duração no formato HH:MM:SS" },
              tokens: { type: Type.INTEGER, description: "Quantidade de tokens (inteiro arredondado para cima)" },
            },
            required: ["user", "duration", "tokens"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("A IA não retornou dados.");
    
    const data: ClockifyData[] = JSON.parse(text.trim());
    
    // Camada extra de segurança no frontend para garantir inteiros arredondados para cima
    return data.map(item => ({
      ...item,
      tokens: Math.ceil(item.tokens)
    }));
  } catch (error: any) {
    console.error("Erro no processamento Gemini:", error);
    throw new Error(error.message || "Erro ao processar arquivo com IA.");
  }
}
