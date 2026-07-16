import { useMemo, useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { useFinanceStore } from "../store/useFinanceStore";
import { Badge, Button, Card, Select, SectionTitle } from "../components/ui";
import { parseDateValue, parseMoneyValue, parseSpreadsheetFile, type ParsedSheet } from "../lib/importFile";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, type Transaction } from "../types";
import { formatBRL } from "../lib/format";
import { formatDateBR } from "../lib/date";

type Step = "upload" | "map" | "done";

export function Importar() {
  const { addManyTransactions } = useFinanceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [fileName, setFileName] = useState("");

  const [dateCol, setDateCol] = useState(0);
  const [descCol, setDescCol] = useState(0);
  const [amountCol, setAmountCol] = useState(0);
  const [invertSign, setInvertSign] = useState(false);
  const [incomeCategory, setIncomeCategory] = useState(DEFAULT_INCOME_CATEGORIES[0]);
  const [expenseCategory, setExpenseCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [importedCount, setImportedCount] = useState(0);

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      setError("Formato não suportado. Envie um arquivo .csv, .xlsx ou .xls.");
      return;
    }
    try {
      const parsed = await parseSpreadsheetFile(file);
      if (parsed.headers.length === 0) {
        setError("Não foi possível ler dados do arquivo. Verifique se ele possui uma linha de cabeçalho.");
        return;
      }
      setSheet(parsed);
      setFileName(file.name);
      setDateCol(guessColumn(parsed.headers, ["data", "date", "dia"]));
      setDescCol(guessColumn(parsed.headers, ["descri", "histor", "lançamento", "lancamento", "memo"]));
      setAmountCol(guessColumn(parsed.headers, ["valor", "amount", "montante", "value"]));
      setStep("map");
    } catch {
      setError("Erro ao processar o arquivo. Confirme se é um extrato válido.");
    }
  }

  const preview = useMemo(() => {
    if (!sheet) return [];
    return sheet.rows.slice(0, 500).map((row) => {
      const rawAmount = parseMoneyValue(row[amountCol]);
      const amount = invertSign ? -rawAmount : rawAmount;
      const type: Transaction["type"] = amount < 0 ? "saida" : "entrada";
      return {
        date: parseDateValue(row[dateCol]),
        description: String(row[descCol] ?? "").trim() || "Movimentação importada",
        amount: Math.abs(amount),
        type,
      };
    });
  }, [sheet, dateCol, descCol, amountCol, invertSign]);

  const totals = useMemo(() => {
    const entradas = preview.filter((p) => p.type === "entrada").reduce((s, p) => s + p.amount, 0);
    const saidas = preview.filter((p) => p.type === "saida").reduce((s, p) => s + p.amount, 0);
    return { entradas, saidas, count: preview.length };
  }, [preview]);

  function handleConfirm() {
    addManyTransactions(
      preview.map((p) => ({
        date: p.date,
        description: p.description,
        type: p.type,
        category: p.type === "entrada" ? incomeCategory : expenseCategory,
        amount: p.amount,
        status: "realizado",
      }))
    );
    setImportedCount(preview.length);
    setStep("done");
  }

  function reset() {
    setSheet(null);
    setFileName("");
    setError(null);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <SectionTitle
          title="Importar Extrato Bancário"
          subtitle="Envie um arquivo Excel (.xlsx) ou CSV com seu extrato para importar automaticamente"
        />

        {step === "upload" && (
          <div
            className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:border-orange-dim transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
          >
            <Upload size={36} className="mx-auto text-orange mb-3" />
            <p className="text-text font-medium">Clique para selecionar ou arraste o arquivo aqui</p>
            <p className="text-xs text-text-muted mt-1">Formatos aceitos: .xlsx, .xls, .csv</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red">{error}</p>}

        {step === "map" && sheet && (
          <div className="space-y-5 mt-2">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <FileSpreadsheet size={16} className="text-orange" />
              {fileName} · {sheet.rows.length} linhas detectadas
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ColumnPicker label="Coluna de Data" headers={sheet.headers} value={dateCol} onChange={setDateCol} />
              <ColumnPicker label="Coluna de Descrição" headers={sheet.headers} value={descCol} onChange={setDescCol} />
              <ColumnPicker label="Coluna de Valor" headers={sheet.headers} value={amountCol} onChange={setAmountCol} />
            </div>

            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={invertSign}
                onChange={(e) => setInvertSign(e.target.checked)}
                className="accent-orange"
              />
              Inverter sinal (marque se valores negativos representam entradas)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted block mb-1">Categoria padrão para entradas</label>
                <Select value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)} className="w-full">
                  {DEFAULT_INCOME_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Categoria padrão para saídas</label>
                <Select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="w-full">
                  {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Badge tone="positive">{totals.count} movimentações · Entradas {formatBRL(totals.entradas)}</Badge>
              <Badge tone="negative">Saídas {formatBRL(totals.saidas)}</Badge>
            </div>

            <div className="overflow-x-auto border border-border rounded-xl max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-2">
                  <tr className="text-left text-text-muted text-xs uppercase">
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((p, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-1.5 whitespace-nowrap">{formatDateBR(p.date)}</td>
                      <td className="px-3 py-1.5 truncate max-w-[280px]">{p.description}</td>
                      <td className="px-3 py-1.5">
                        <Badge tone={p.type === "entrada" ? "positive" : "negative"}>
                          {p.type === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatBRL(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 50 && (
                <p className="text-xs text-text-muted px-3 py-2">
                  Mostrando 50 de {preview.length} linhas. Todas serão importadas.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleConfirm} disabled={preview.length === 0}>
                Confirmar importação de {preview.length} movimentações
              </Button>
              <Button variant="secondary" onClick={reset}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-10">
            <CheckCircle2 size={44} className="mx-auto text-green mb-3" />
            <p className="text-text font-semibold">
              {importedCount} movimentações importadas com sucesso!
            </p>
            <p className="text-sm text-text-muted mt-1">
              Confira e ajuste os lançamentos na aba Fluxo de Caixa.
            </p>
            <Button className="mt-4" onClick={reset}>
              Importar outro arquivo
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle title="Dicas para importação" />
        <ul className="text-sm text-text-muted list-disc pl-5 space-y-1.5">
          <li>Exporte o extrato do seu banco em formato Excel (.xlsx) ou CSV.</li>
          <li>O arquivo deve ter uma linha de cabeçalho e uma coluna de data, descrição e valor.</li>
          <li>Valores negativos são tratados como saídas e positivos como entradas (ajustável acima).</li>
          <li>Depois de importar, revise categorias e status na aba Fluxo de Caixa.</li>
        </ul>
      </Card>
    </div>
  );
}

function guessColumn(headers: string[], keywords: string[]): number {
  const idx = headers.findIndex((h) =>
    keywords.some((k) => h.toLowerCase().includes(k))
  );
  return idx >= 0 ? idx : 0;
}

function ColumnPicker({
  label,
  headers,
  value,
  onChange,
}: {
  label: string;
  headers: string[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-text-muted block mb-1">{label}</label>
      <Select value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full">
        {headers.map((h, i) => (
          <option key={i} value={i}>
            {h}
          </option>
        ))}
      </Select>
    </div>
  );
}
