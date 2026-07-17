import { Plus, Trash2 } from "lucide-react";
import { useFinanceStore } from "../store/useFinanceStore";
import { DEFAULT_EXPENSE_CATEGORIES, type CostType, type MonthlyCost } from "../types";
import { Button, Card, EmptyState, Input, ProgressBar, Select, SectionTitle, StatTile } from "../components/ui";
import { formatBRL, formatPercent } from "../lib/format";
import { getRankedCosts, getTotalFixedCosts, getTotalVariableCosts } from "../lib/finance";

export function Custos() {
  const { monthlyCosts, addMonthlyCost, updateMonthlyCost, removeMonthlyCost } =
    useFinanceStore();

  const totalFixed = getTotalFixedCosts(monthlyCosts);
  const totalVariable = getTotalVariableCosts(monthlyCosts);
  const total = totalFixed + totalVariable;
  const { fixed, variable } = getRankedCosts(monthlyCosts);

  function handleAdd(type: CostType) {
    addMonthlyCost({
      name: type === "fixo" ? "Novo custo fixo" : "Novo custo variável",
      type,
      category: DEFAULT_EXPENSE_CATEGORIES[0],
      amount: 0,
      active: true,
      dueDay: 5,
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Total Custos Fixos / mês" value={formatBRL(totalFixed)} />
        <StatTile label="Total Custos Variáveis / mês" value={formatBRL(totalVariable)} />
        <StatTile
          label="Custo Mensal Total"
          value={formatBRL(total)}
          hint={total > 0 ? `${formatPercent((totalFixed / total) * 100)} fixo · ${formatPercent((totalVariable / total) * 100)} variável` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostGroup
          title="Custos Fixos"
          subtitle="Não variam com o volume de vendas — cada custo ativo vira automaticamente uma conta a pagar prevista todo mês"
          items={fixed}
          maxAmount={fixed[0]?.amount ?? 0}
          onAdd={() => handleAdd("fixo")}
          onUpdate={updateMonthlyCost}
          onRemove={removeMonthlyCost}
        />
        <CostGroup
          title="Custos Variáveis"
          subtitle="Oscilam conforme o faturamento — cada custo ativo vira automaticamente uma conta a pagar prevista todo mês"
          items={variable}
          maxAmount={variable[0]?.amount ?? 0}
          onAdd={() => handleAdd("variavel")}
          onUpdate={updateMonthlyCost}
          onRemove={removeMonthlyCost}
        />
      </div>
    </div>
  );
}

function CostGroup({
  title,
  subtitle,
  items,
  maxAmount,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  subtitle: string;
  items: MonthlyCost[];
  maxAmount: number;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<MonthlyCost>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card>
      <SectionTitle
        title={title}
        subtitle={subtitle}
        action={
          <Button size="sm" onClick={onAdd}>
            <span className="flex items-center gap-1.5">
              <Plus size={14} /> Adicionar
            </span>
          </Button>
        }
      />
      {items.length === 0 ? (
        <EmptyState text="Nenhum custo cadastrado ainda." />
      ) : (
        <ul className="space-y-3">
          {items.map((c, idx) => (
            <li key={c.id} className="rounded-xl border border-border bg-surface-2/40 p-3">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-orange-bright w-5 pt-2 shrink-0">
                  #{idx + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={c.name}
                      onChange={(e) => onUpdate(c.id, { name: e.target.value })}
                      className="flex-1 min-w-[140px]"
                    />
                    <Input
                      type="number"
                      value={c.amount}
                      onChange={(e) => onUpdate(c.id, { amount: Number(e.target.value) || 0 })}
                      className="w-[110px] text-right tabular-nums"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={DEFAULT_EXPENSE_CATEGORIES.includes(c.category) ? c.category : "Outros"}
                      onChange={(e) => onUpdate(c.id, { category: e.target.value })}
                      className="text-xs py-1"
                    >
                      {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Select>
                    <label className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                      Dia venc.
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={c.dueDay}
                        onChange={(e) =>
                          onUpdate(c.id, {
                            dueDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                          })
                        }
                        className="w-14 text-center py-1"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-text-muted">
                      <input
                        type="checkbox"
                        checked={c.active}
                        onChange={(e) => onUpdate(c.id, { active: e.target.checked })}
                        className="accent-orange"
                      />
                      Ativo
                    </label>
                    <button
                      onClick={() => onRemove(c.id)}
                      className="ml-auto text-text-muted hover:text-red p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <ProgressBar value={c.amount} max={maxAmount} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
