export interface ScanEntry {
  type: string;
  time: string;
  date: string;
  timestamp: number;
}

export const DATES = [
  '2026-04-19',
  '2026-04-18',
  '2026-04-12',
  '2026-04-11',
];

export async function fetchScanData(dateStr: string): Promise<ScanEntry[]> {
  const response = await fetch(`/reportes/scans_${dateStr}.txt`);
  if (!response.ok) {
    console.error(`Failed to fetch report for ${dateStr}`);
    return [];
  }
  const text = await response.text();
  
  const entries: ScanEntry[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('Tipo:')) {
      // Tipo: fish, Hora: 09:54:34
      const parts = line.split(',');
      if (parts.length >= 2) {
        const typeStr = parts[0].trim().replace('Tipo:', '').trim();
        const timeStr = parts[1].trim().replace('Hora:', '').trim();
        
        // Create full timestamp for time-based charts
        const parsedDate = new Date(`${dateStr}T${timeStr}`);
        
        entries.push({
          type: typeStr,
          time: timeStr,
          date: dateStr,
          timestamp: parsedDate.getTime(),
        });
      }
    }
  }
  
  return entries;
}

export async function fetchAllData(): Promise<ScanEntry[]> {
  const promises = DATES.map(date => fetchScanData(date));
  const results = await Promise.all(promises);
  return results.flat();
}
