
import { GoogleGenAI, Type } from "@google/genai";
import { ClockifyData } from "../types";

// parseClockifyReport extracts data from Clockify exports using Gemini 3 Pro
// We use gemini-3-pro-preview because this task involves complex reasoning and math (converting time durations to tokens).
export async function parseClockifyReport(fileBase64: string, mimeType: string): Promise<ClockifyData[]> {
  // Always use a new GoogleGenAI instance with the direct process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Remove o prefixo data:mime/type;base64, se existir
    const base64Data = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            text: `Analise este relatório do Clockify (pode ser PDF ou imagem). 
            Extraia o NOME de cada usuário e a DURAÇÃO TOTAL trabalhada por ele.
            
            REGRAS DE CÁLCULO:
            1. Converta a duração HH:MM:SS para horas decimais.
            2. Multiplique as horas decimais por 0.4 para obter os tokens.
            Exemplo: 10:30:00 = 10.5 horas -> 10.5 * 0.4 = 4.2 tokens.
            
            Retorne um JSON contendo o nome exato do usuário, a duração original e o valor final de tokens calculado.`
          },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              user: { type: Type.STRING, description: "Nome exato do usuário no relatório" },
              duration: { type: Type.STRING, description: "Duração no formato HH:MM:SS" },
              tokens: { type: Type.NUMBER, description: "Tokens finais (horas * 0.4)" }
            },
            required: ["user", "duration", "tokens"]
          }
        }
      }
    });

    // Directly access the .text property from GenerateContentResponse
    const text = response.text;
    if (!text) {
      console.warn("IA retornou uma resposta vazia.");
      return [];
    }

    const result = JSON.parse(text.trim());
    console.log("Dados extraídos do relatório:", result);
    return result;
  } catch (error) {
    console.error("Erro ao processar relatório via Gemini:", error);
    return [];
  }
}
