
import { ClockifyData } from "../types";

/**
 * Converte duração formatada do Clockify (HH:MM:SS ou decimal) em tokens.
 * Regra: 1h = 0.4 Tokens
 */
function parseDurationToTokens(durationStr: string): number {
  if (!durationStr) return 0;
  
  const cleanStr = durationStr.replace(/"/g, '').trim();
  
  // Caso esteja em formato decimal (ex: 10.5)
  if (!cleanStr.includes(':')) {
    const hours = parseFloat(cleanStr.replace(',', '.'));
    return isNaN(hours) ? 0 : hours * 0.4;
  }

  // Caso esteja em formato HH:MM:SS ou HH:MM
  const parts = cleanStr.split(':');
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;
  const s = parts[2] ? parseInt(parts[2]) : 0;

  const totalHours = h + (m / 60) + (s / 3600);
  return totalHours * 0.4;
}

/**
 * Processa um arquivo CSV do Clockify localmente no navegador.
 * Resolve o erro de "API Key must be set" ao eliminar a dependência de IA externa.
 */
export async function parseClockifyReport(fileBase64: string, _mimeType: string): Promise<ClockifyData[]> {
  try {
    // Decodifica o base64 respeitando UTF-8 (acentos)
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

    if (userIdx === -1 || durationIdx === -1) {
      throw new Error("Colunas 'User' e 'Duration' não encontradas no CSV. Certifique-se de exportar o relatório 'Summary' como CSV no Clockify.");
    }

    const groupedMap = new Map<string, number>();

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      // Regex para splitar CSV lidando com aspas que podem conter o separador
      const regex = new RegExp(`${separator}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
      const cells = row.split(regex).map(c => c.replace(/"/g, '').trim());
      
      const userName = cells[userIdx];
      const duration = cells[durationIdx];

      if (userName && duration) {
        const tokens = parseDurationToTokens(duration);
        const currentTokens = groupedMap.get(userName) || 0;
        groupedMap.set(userName, currentTokens + tokens);
      }
    }

    return Array.from(groupedMap.entries()).map(([user, tokens]) => ({
      user,
      duration: "Calculado Localmente",
      tokens: parseFloat(tokens.toFixed(2))
    }));
  } catch (error) {
    console.error("Erro no processador local:", error);
    throw error;
  }
}
