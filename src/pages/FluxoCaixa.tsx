import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFinanceStore } from "../store/useFinanceStore";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  type Transaction,
} from "../types";
import { Badge, Button, Card, EmptyState, Input, Select, SectionTitle, StatTile } from "../components/ui";
import { formatBRL } from "../lib/format";
import { todayISO } from "../lib/date";

type Filter = "todos" | "entrada" | "saida";

export function FluxoCaixa() {
  const { transactions, addTransaction, updateTransaction, removeTransaction } =
    useFinanceStore();
  const [filter, setFilter] = useState<Filter>("todos");
  const [monthFilter, setMonthFilter] = useState<string>("todos");
  const [search, setSearch] = useState("");

  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (filter === "todos" ? true : t.type === filter))
      .filter((t) => (monthFilter === "todos" ? true : t.date.slice(0, 7) === monthFilter))
      .filter((t) =>
        search.trim() === ""
          ? true
          : t.description.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filter, monthFilter, search]);

  const totals = useMemo(() => {
    const entradas = filtered
      .filter((t) => t.type === "entrada")
      .reduce((s, t) => s + t.amount, 0);
    const saidas = filtered
      .filter((t) => t.type === "saida")
      .reduce((s, t) => s + t.amount, 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filtered]);

  function handleAdd() {
    addTransaction({
      date: todayISO(),
      description: "Nova movimentação",
      type: "entrada",
      category: DEFAULT_INCOME_CATEGORIES[0],
      amount: 0,
      status: "previsto",
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Entradas (filtro atual)" value={formatBRL(totals.entradas)} tone="positive" />
        <StatTile label="Saídas (filtro atual)" value={formatBRL(totals.saidas)} tone="negative" />
        <StatTile
          label="Saldo do período"
          value={formatBRL(totals.saldo)}
          tone={totals.saldo >= 0 ? "positive" : "negative"}
        />
      </div>

      <Card>
        <SectionTitle
          title="Entradas e Saídas"
          subtitle="Edite qualquer campo diretamente na tabela"
          action={
            <Button onClick={handleAdd}>
              <span className="flex items-center gap-1.5">
                <Plus size={16} /> Nova movimentação
              </span>
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="todos">Todos os tipos</option>
            <option value="entrada">Somente entradas</option>
            <option value="saida">Somente saídas</option>
          </Select>
          <Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="todos">Todos os meses</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Buscar por descrição ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px] flex-1"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState text="Nenhuma movimentação encontrada." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-text-muted text-xs uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Data</th>
                  <th className="px-2 py-2 font-medium">Descrição</th>
                  <th className="px-2 py-2 font-medium">Categoria</th>
                  <th className="px-2 py-2 font-medium">Tipo</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium text-right">Valor</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <TxRow
                    key={t.id}
                    tx={t}
                    onUpdate={(patch) => updateTransaction(t.id, patch)}
                    onRemove={() => removeTransaction(t.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function TxRow({
  tx,
  onUpdate,
  onRemove,
}: {
  tx: Transaction;
  onUpdate: (patch: Partial<Transaction>) => void;
  onRemove: () => void;
}) {
  const categories =
    tx.type === "entrada" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  return (
    <tr className="border-t border-border hover:bg-surface-2/50">
      <td className="px-5 py-2">
        <Input
          type="date"
          value={tx.date}
          onChange={(e) => onUpdate({ date: e.target.value })}
          className="w-[150px]"
        />
      </td>
      <td className="px-2 py-2">
        <Input
          value={tx.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full min-w-[160px]"
        />
      </td>
      <td className="px-2 py-2">
        <Select
          value={categories.includes(tx.category) ? tx.category : "Outros"}
          onChange={(e) => onUpdate({ category: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-2 py-2">
        <Select
          value={tx.type}
          onChange={(e) =>
            onUpdate({
              type: e.target.value as Transaction["type"],
              category:
                e.target.value === "entrada"
                  ? DEFAULT_INCOME_CATEGORIES[0]
                  : DEFAULT_EXPENSE_CATEGORIES[0],
            })
          }
        >
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </Select>
      </td>
      <td className="px-2 py-2">
        <Select
          value={tx.status}
          onChange={(e) => onUpdate({ status: e.target.value as Transaction["status"] })}
        >
          <option value="realizado">Realizado</option>
          <option value="previsto">Previsto</option>
        </Select>
      </td>
      <td className="px-2 py-2 text-right">
        <Input
          type="number"
          value={tx.amount}
          onChange={(e) => onUpdate({ amount: Number(e.target.value) || 0 })}
          className="w-[120px] text-right tabular-nums"
        />
      </td>
      <td className="px-2 py-2">
        <button onClick={onRemove} className="text-text-muted hover:text-red p-1">
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}

export function TypeBadge({ type }: { type: Transaction["type"] }) {
  return type === "entrada" ? (
    <Badge tone="positive">Entrada</Badge>
  ) : (
    <Badge tone="negative">Saída</Badge>
  );
}
