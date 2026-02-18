
import { ClockifyData, User } from "../types";

/**
 * Normaliza uma string para comparação (remove acentos, espaços duplos e converte para minusculo)
 */
function normalize(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ') // Substitui múltiplos espaços/quebras por um único espaço
    .trim();
}

/**
 * Tenta encontrar um membro na linha de texto usando busca parcial
 */
function findMemberInText(text: string, members: User[]): User | null {
  const normalizedText = normalize(text);
  if (!normalizedText) return null;

  // Ordenar membros por tamanho do nome (descendente) para evitar matches de "João" em "João Luiz"
  const sortedMembers = [...members].sort((a, b) => b.name.length - a.name.length);
  
  for (const m of sortedMembers) {
    const cid = normalize(m.clockifyId);
    const name = normalize(m.name);
    
    // Se a linha contém o ID ou o Nome do membro
    if (normalizedText.includes(cid) || normalizedText.includes(name)) {
      return m;
    }
  }
  return null;
}

/**
 * Extrai dados do PDF do Clockify.
 */
export async function parseClockifyPdf(fileArrayBuffer: ArrayBuffer, dbMembers: User[]): Promise<ClockifyData[]> {
  console.log("Iniciando processamento do PDF...");
  
  // @ts-ignore - Detectar lib em diferentes ambientes de CDN
  const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  
  if (!pdfjsLib) {
    throw new Error("Biblioteca PDF.js não carregada. Verifique sua conexão ou o index.html.");
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
  const pdf = await loadingTask.promise;
  const hourAccumulator: { [clockifyId: string]: number } = {};

  // Estado persistente entre páginas: qual membro estamos processando?
  let activeMember: User | null = null;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    // Agrupar itens por linha com tolerância de 5 pixels
    const linesMap: { [y: number]: any[] } = {};
    items.forEach(item => {
      const y = item.transform[5];
      const existingY = Object.keys(linesMap).find(key => Math.abs(Number(key) - y) < 5);
      const targetY = existingY ? Number(existingY) : y;
      
      if (!linesMap[targetY]) linesMap[targetY] = [];
      linesMap[targetY].push(item);
    });

    const sortedY = Object.keys(linesMap).sort((a, b) => Number(b) - Number(a));

    sortedY.forEach(y => {
      const lineItems = linesMap[Number(y)].sort((a, b) => a.transform[4] - b.transform[4]);
      const lineText = lineItems.map(item => item.str).join(" ");
      const normalizedLine = normalize(lineText);

      // 1. Verificar se a linha indica uma TROCA de membro
      const detectedMember = findMemberInText(lineText, dbMembers);
      if (detectedMember) {
        // No Clockify Detailed Report, a linha do Usuário costuma não ter data de registro
        // Se encontrarmos um membro e a linha não tiver o padrão DD/MM/YYYY, definimos como ativo
        if (!/\d{2}\/\d{2}\/\d{4}/.test(normalizedLine)) {
            activeMember = detectedMember;
        }
      }

      // 2. Ignorar linhas de "Total" para evitar duplicar as horas somadas do relatório
      if (normalizedLine.includes("total")) return;

      // 3. Procurar por durações (HH:MM:SS ou H:MM:SS)
      // Regex atualizado para pegar tempos como 0:05:00 ou 10:30:15
      const durationMatches = lineText.match(/(\d{1,2}:\d{2}:\d{2})/g);
      
      if (durationMatches) {
        // Se a linha tem duração mas não temos membro ativo detectado pelo cabeçalho, 
        // tentamos encontrar o membro na própria linha (fallback)
        const finalMember = activeMember || detectedMember;

        if (finalMember && /\d{2}\/\d{2}\/\d{4}/.test(normalizedLine)) {
          const durationStr = durationMatches[durationMatches.length - 1];
          const h = parseDurationToHours(durationStr);
          const cid = finalMember.clockifyId;
          hourAccumulator[cid] = (hourAccumulator[cid] || 0) + h;
        }
      }
    });
  }

  const results = Object.keys(hourAccumulator).map(cid => {
    const totalHours = hourAccumulator[cid];
    const tokens = Math.ceil(totalHours * 0.4);
    
    // Encontrar o nome real para o retorno
    const member = dbMembers.find(m => m.clockifyId === cid);

    return {
      user: member ? member.name : cid,
      duration: formatHoursToHHMM(totalHours),
      tokens: tokens
    };
  });

  console.log("Processamento concluído. Resultados encontrados:", results.length);
  return results.sort((a, b) => b.tokens - a.tokens);
}

function parseDurationToHours(duration: string): number {
  const parts = duration.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parseInt(parts[2], 10);
  return h + (m / 60) + (s / 3600);
}

function formatHoursToHHMM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const s = Math.round(((hours - h) * 60 - m) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
