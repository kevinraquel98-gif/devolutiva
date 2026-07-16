import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFinanceStore } from "../store/useFinanceStore";
import type { PayableReceivableType, PayableReceivable } from "../types";
import { Badge, Button, Card, EmptyState, Input, SectionTitle, StatTile } from "../components/ui";
import { formatBRL } from "../lib/format";
import { daysUntil, todayISO } from "../lib/date";
import { getOverdue, getUpcoming } from "../lib/finance";

type ViewFilter = "30dias" | "vencidas" | "todas";

export function Contas() {
  const { items, addItem, updateItem, removeItem } = useFinanceStore();
  const [type, setType] = useState<PayableReceivableType>("receber");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("30dias");

  const upcoming = getUpcoming(items, 30);
  const overdue = getOverdue(items);

  const list = useMemo(() => {
    let base = items.filter((i) => i.type === type);
    if (viewFilter === "30dias") {
      base = base.filter((i) => !i.paid && daysUntil(i.dueDate) <= 30 && daysUntil(i.dueDate) >= 0);
    } else if (viewFilter === "vencidas") {
      base = base.filter((i) => !i.paid && daysUntil(i.dueDate) < 0);
    }
    return base.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [items, type, viewFilter]);

  function handleAdd() {
    addItem({
      description: type === "receber" ? "Nova conta a receber" : "Nova conta a pagar",
      counterparty: "",
      type,
      amount: 0,
      dueDate: todayISO(),
      paid: false,
    });
  }

  const overdueForType = overdue.filter((i) => i.type === type);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="A Receber — próx. 30 dias"
          value={formatBRL(upcoming.totalReceivable)}
          tone="positive"
        />
        <StatTile
          label="A Pagar — próx. 30 dias"
          value={formatBRL(upcoming.totalPayable)}
          tone="negative"
        />
        <StatTile
          label="Total Vencido (pendente)"
          value={formatBRL(overdue.reduce((s, i) => s + i.amount, 0))}
          tone={overdue.length > 0 ? "warning" : "neutral"}
          hint={`${overdue.length} conta(s) vencida(s)`}
        />
      </div>

      <Card>
        <SectionTitle
          title="Contas a Pagar e Receber"
          subtitle="Edite valores, vencimentos e marque como pago/recebido"
          action={
            <Button onClick={handleAdd}>
              <span className="flex items-center gap-1.5">
                <Plus size={16} /> Nova conta
              </span>
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setType("receber")}
              className={`px-4 py-1.5 text-sm ${
                type === "receber" ? "bg-orange text-black font-semibold" : "text-text-muted hover:bg-surface-2"
              }`}
            >
              A Receber
            </button>
            <button
              onClick={() => setType("pagar")}
              className={`px-4 py-1.5 text-sm ${
                type === "pagar" ? "bg-orange text-black font-semibold" : "text-text-muted hover:bg-surface-2"
              }`}
            >
              A Pagar
            </button>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden ml-auto">
            {(
              [
                ["30dias", "Próx. 30 dias"],
                ["vencidas", `Vencidas (${overdueForType.length})`],
                ["todas", "Todas"],
              ] as [ViewFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setViewFilter(key)}
                className={`px-3 py-1.5 text-xs ${
                  viewFilter === key
                    ? "bg-orange/15 text-orange-bright font-semibold"
                    : "text-text-muted hover:bg-surface-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <EmptyState text="Nenhuma conta encontrada para este filtro." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-text-muted text-xs uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Descrição</th>
                  <th className="px-2 py-2 font-medium">Contraparte</th>
                  <th className="px-2 py-2 font-medium">Vencimento</th>
                  <th className="px-2 py-2 font-medium text-right">Valor</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onUpdate={(patch) => updateItem(item.id, patch)}
                    onRemove={() => removeItem(item.id)}
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

function ItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: PayableReceivable;
  onUpdate: (patch: Partial<PayableReceivable>) => void;
  onRemove: () => void;
}) {
  const days = daysUntil(item.dueDate);
  const overdue = !item.paid && days < 0;
  return (
    <tr className={`border-t border-border hover:bg-surface-2/50 ${overdue ? "bg-red/5" : ""}`}>
      <td className="px-5 py-2">
        <Input
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full min-w-[160px]"
        />
      </td>
      <td className="px-2 py-2">
        <Input
          value={item.counterparty}
          onChange={(e) => onUpdate({ counterparty: e.target.value })}
          className="w-full min-w-[140px]"
        />
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={item.dueDate}
            onChange={(e) => onUpdate({ dueDate: e.target.value })}
            className="w-[150px]"
          />
          {!item.paid && (
            <Badge tone={overdue ? "negative" : days <= 7 ? "warning" : "neutral"}>
              {overdue ? `${Math.abs(days)}d atrasado` : `em ${days}d`}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-2 py-2 text-right">
        <Input
          type="number"
          value={item.amount}
          onChange={(e) => onUpdate({ amount: Number(e.target.value) || 0 })}
          className="w-[120px] text-right tabular-nums"
        />
      </td>
      <td className="px-2 py-2">
        <label className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
          <input
            type="checkbox"
            checked={item.paid}
            onChange={(e) => onUpdate({ paid: e.target.checked })}
            className="accent-orange"
          />
          {item.type === "pagar" ? "Pago" : "Recebido"}
        </label>
      </td>
      <td className="px-2 py-2">
        <button onClick={onRemove} className="text-text-muted hover:text-red p-1">
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}
