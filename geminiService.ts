import { GoogleGenAI, Type } from "@google/genai";
import { ClockifyData } from "../types";

/**
 * Processa um arquivo CSV do Clockify usando a API do Gemini.
 * O modelo é capaz de identificar automaticamente colunas e converter durações para tokens.
 * Regra: 1h = 0.4 Tokens
 */
export async function parseClockifyReport(fileBase64: string, _mimeType: string): Promise<ClockifyData[]> {
  try {
    // Inicializa o cliente Gemini usando a chave da variável de ambiente exclusiva process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Decodifica o base64 para texto respeitando UTF-8 para suportar caracteres especiais em nomes.
    const base64Content = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const csvContent = new TextDecoder('utf-8').decode(bytes);

    // Utilizamos o modelo gemini-3-pro-preview para tarefas complexas de extração de texto e raciocínio.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analise o conteúdo do CSV do Clockify abaixo.
      Extraia o nome de cada usuário e calcule o total de tokens com base na duração total trabalhada.
      Regra de conversão: 1 hora = 0.4 tokens.
      Retorne um array JSON de objetos.
      
      Conteúdo do CSV:
      ${csvContent}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              user: { type: Type.STRING, description: "Nome exato do usuário conforme consta no CSV" },
              tokens: { type: Type.NUMBER, description: "Total de tokens calculados (horas * 0.4)" }
            },
            required: ["user", "tokens"]
          }
        }
      }
    });

    // Acessa a propriedade .text diretamente para obter a string de saída.
    const jsonStr = response.text?.trim() || "[]";
    const parsedData = JSON.parse(jsonStr);

    // Mapeia os dados processados pela IA para o formato ClockifyData da aplicação.
    return parsedData.map((item: any) => ({
      user: item.user,
      duration: "Processado por Gemini",
      tokens: parseFloat(Number(item.tokens).toFixed(2))
    }));
  } catch (error) {
    console.error("Erro ao processar CSV com Gemini, utilizando parser manual de fallback:", error);
    return parseClockifyReportManual(fileBase64);
  }
}

/**
 * Parser manual resiliente utilizado como fallback para a extração de dados do CSV.
 */
function parseClockifyReportManual(fileBase64: string): ClockifyData[] {
  try {
    const base64Content = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const csvContent = new TextDecoder('utf-8').decode(bytes);
    
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return [];

    const header = lines[0];
    const separator = header.includes(';') ? ';' : ',';
    const columns = header.split(separator).map(c => c.replace(/"/g, '').trim().toLowerCase());

    const userIdx = columns.findIndex(c => c.includes('user') || c.includes('usuário') || c.includes('nome'));
    const durationIdx = columns.findIndex(c => c.includes('duration') || c.includes('duração') || c.includes('time'));

    if (userIdx === -1 || durationIdx === -1) return [];

    const results: ClockifyData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const regex = new RegExp(`${separator}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
      const cells = row.split(regex).map(c => c.replace(/"/g, '').trim());
      
      const userName = cells[userIdx];
      const duration = cells[durationIdx];

      if (userName && duration) {
        let h = 0;
        if (duration.includes(':')) {
          const p = duration.split(':');
          h = (parseInt(p[0]) || 0) + (parseInt(p[1]) || 0) / 60 + (parseInt(p[2] || "0")) / 3600;
        } else {
          h = parseFloat(duration.replace(',', '.'));
        }
        results.push({
          user: userName,
          duration: duration,
          tokens: h * 0.4
        });
      }
    }

    const groupedMap = new Map<string, ClockifyData>();
    results.forEach(item => {
      const existing = groupedMap.get(item.user);
      if (existing) {
        existing.tokens = existing.tokens + item.tokens;
      } else {
        groupedMap.set(item.user, { ...item });
      }
    });

    return Array.from(groupedMap.values()).map(item => ({
      ...item,
      tokens: parseFloat(item.tokens.toFixed(2))
    }));
  } catch (e) {
    return [];
  }
}
