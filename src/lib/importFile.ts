import * as XLSX from "xlsx";
import { format } from "date-fns";
import { todayISO } from "./date";

export interface ParsedSheet {
  headers: string[];
  rows: unknown[][];
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCsvFile(file);
  return parseXlsxFile(file);
}

// CSV is parsed manually (as plain strings) instead of via XLSX.read, because
// SheetJS's CSV type-sniffing assumes US conventions (comma thousands separator,
// mm/dd/yyyy dates) and silently mangles pt-BR statements ("1500,00" -> 150000,
// "01/07/2026" read as Jan 7 instead of Jul 1). Real .xlsx/.xls files keep their
// typed cell values from Excel, so those go through XLSX.read unchanged.
async function parseCsvFile(file: File): Promise<ParsedSheet> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };
  const delimiter = detectCsvDelimiter(lines[0]);
  const rows = lines.map((l) => splitCsvLine(l, delimiter));
  const headers = rows[0].map((h, i) => (h.trim() === "" ? `Coluna ${i + 1}` : h.trim()));
  return { headers, rows: rows.slice(1) };
}

function detectCsvDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

async function parseXlsxFile(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
  });
  const nonEmpty = raw.filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };
  const headers = nonEmpty[0].map((h, i) => (String(h).trim() === "" ? `Coluna ${i + 1}` : String(h)));
  const rows = nonEmpty.slice(1);
  return { headers, rows };
}

export function parseMoneyValue(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return 0;
  let s = v.trim();
  if (s === "") return 0;
  let neg = false;
  if (/^\(.*\)$/.test(s)) {
    neg = true;
    s = s.slice(1, -1);
  }
  if (/^-/.test(s)) neg = true;
  s = s.replace(/[^\d.,]/g, "");
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return neg ? -Math.abs(n) : Math.abs(n);
}

export function parseDateValue(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return format(v, "yyyy-MM-dd");
  }
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const epoch = Date.UTC(1899, 11, 30);
    const d = new Date(epoch + v * 86400000);
    return format(d, "yyyy-MM-dd");
  }
  if (typeof v === "string") {
    const s = v.trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
    if (m) {
      const [, d, mo, yRaw] = m;
      const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
      return `${y.padStart(4, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return todayISO();
}
