import { ClockifyData } from "../types";

/**
 * Converte duração formatada do Clockify (HH:MM:SS ou decimal) em tokens.
 * Regra: 1h = 0.4 Tokens
 */
function parseDurationToTokens(durationStr: string): number {
  if (!durationStr) return 0;
  
  // Caso esteja em formato decimal (ex: 10.5)
  if (!durationStr.includes(':')) {
    const hours = parseFloat(durationStr.replace(',', '.'));
    return isNaN(hours) ? 0 : hours * 0.4;
  }

  // Caso esteja em formato HH:MM:SS
  const parts = durationStr.split(':');
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;
  const s = parseInt(parts[2]) || 0;

  const totalHours = h + (m / 60) + (s / 3600);
  return totalHours * 0.4;
}

/**
 * Processa um arquivo CSV do Clockify sem usar IA.
 * Identifica as colunas de Usuário e Duração automaticamente.
 */
export async function parseClockifyReport(fileBase64: string, _mimeType: string): Promise<ClockifyData[]> {
  try {
    // Decodifica o base64 para string
    const base64Content = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const csvContent = atob(base64Content);
    
    // Divide por linhas e remove linhas vazias
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return [];

    // Tenta identificar o separador (vírgula ou ponto-e-vírgula)
    const header = lines[0];
    const separator = header.includes(';') ? ';' : ',';
    const columns = header.split(separator).map(c => c.replace(/"/g, '').trim().toLowerCase());

    // Localiza os índices das colunas necessárias
    // O Clockify exporta como "User" ou "Usuário" e "Duration" ou "Duração"
    const userIdx = columns.findIndex(c => c.includes('user') || c.includes('usuário') || c.includes('nome'));
    const durationIdx = columns.findIndex(c => c.includes('duration') || c.includes('duração') || c.includes('time'));

    if (userIdx === -1 || durationIdx === -1) {
      console.error("Colunas não encontradas no CSV. Certifique-se de exportar o relatório do Clockify.");
      return [];
    }

    const results: ClockifyData[] = [];

    // Processa os dados (pula o cabeçalho)
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(separator).map(c => c.replace(/"/g, '').trim());
      const userName = cells[userIdx];
      const duration = cells[durationIdx];

      if (userName && duration) {
        const tokens = parseDurationToTokens(duration);
        results.push({
          user: userName,
          duration: duration,
          tokens: parseFloat(tokens.toFixed(2))
        });
      }
    }

    // Agrupa resultados por usuário (caso haja múltiplas entradas no CSV)
    const grouped = results.reduce((acc, curr) => {
      const existing = acc.find(item => item.user === curr.user);
      if (existing) {
        existing.tokens += curr.user === curr.user ? curr.tokens : 0;
      } else {
        acc.push(curr);
      }
      return acc;
    }, [] as ClockifyData[]);

    return grouped;
  } catch (error) {
    console.error("Erro ao processar CSV:", error);
    return [];
  }
}

// Mantendo a assinatura antiga para compatibilidade, mas removendo a chamada da IA.
// A função acima agora lida com tudo de forma determinística.
