import { useMemo } from "react";
import { CheckCircle2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useFinanceStore } from "../store/useFinanceStore";
import { DEFAULT_EXPENSE_CATEGORIES, type CostType, type MonthlyCost, type PayableReceivable } from "../types";
import { Badge, Button, Card, EmptyState, Input, ProgressBar, Select, SectionTitle, StatTile } from "../components/ui";
import { formatBRL, formatPercent } from "../lib/format";
import { costInstallmentIndexForMonth, getTotalFixedCosts, getTotalVariableCosts } from "../lib/finance";
import { formatDateBR, monthKey, todayISO } from "../lib/date";

export function Custos() {
  const {
    monthlyCosts,
    items,
    addMonthlyCost,
    updateMonthlyCost,
    removeMonthlyCost,
    markCostPaid,
    markCostUnpaid,
  } = useFinanceStore();

  const totalFixed = getTotalFixedCosts(monthlyCosts);
  const totalVariable = getTotalVariableCosts(monthlyCosts);
  const total = totalFixed + totalVariable;

  const fixed = useMemo(
    () => monthlyCosts.filter((c) => c.type === "fixo").sort((a, b) => b.amount - a.amount),
    [monthlyCosts]
  );
  const variable = useMemo(
    () => monthlyCosts.filter((c) => c.type === "variavel").sort((a, b) => b.amount - a.amount),
    [monthlyCosts]
  );

  const currentMonth = monthKey(todayISO());
  const currentMonthItemByCost = useMemo(() => {
    const map = new Map<string, PayableReceivable>();
    for (const item of items) {
      if (item.sourceCostId && monthKey(item.dueDate) === currentMonth) {
        map.set(item.sourceCostId, item);
      }
    }
    return map;
  }, [items, currentMonth]);

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
          currentMonthItemByCost={currentMonthItemByCost}
          onAdd={() => handleAdd("fixo")}
          onUpdate={updateMonthlyCost}
          onRemove={removeMonthlyCost}
          onMarkPaid={markCostPaid}
          onMarkUnpaid={markCostUnpaid}
        />
        <CostGroup
          title="Custos Variáveis"
          subtitle="Oscilam conforme o faturamento — cada custo ativo vira automaticamente uma conta a pagar prevista todo mês"
          items={variable}
          maxAmount={variable[0]?.amount ?? 0}
          currentMonthItemByCost={currentMonthItemByCost}
          onAdd={() => handleAdd("variavel")}
          onUpdate={updateMonthlyCost}
          onRemove={removeMonthlyCost}
          onMarkPaid={markCostPaid}
          onMarkUnpaid={markCostUnpaid}
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
  currentMonthItemByCost,
  onAdd,
  onUpdate,
  onRemove,
  onMarkPaid,
  onMarkUnpaid,
}: {
  title: string;
  subtitle: string;
  items: MonthlyCost[];
  maxAmount: number;
  currentMonthItemByCost: Map<string, PayableReceivable>;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<MonthlyCost>) => void;
  onRemove: (id: string) => void;
  onMarkPaid: (costId: string) => void;
  onMarkUnpaid: (costId: string) => void;
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
            <CostRow
              key={c.id}
              cost={c}
              rank={idx + 1}
              maxAmount={maxAmount}
              currentMonthItem={currentMonthItemByCost.get(c.id)}
              onUpdate={(patch) => onUpdate(c.id, patch)}
              onRemove={() => onRemove(c.id)}
              onMarkPaid={() => onMarkPaid(c.id)}
              onMarkUnpaid={() => onMarkUnpaid(c.id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function CostRow({
  cost: c,
  rank,
  maxAmount,
  currentMonthItem,
  onUpdate,
  onRemove,
  onMarkPaid,
  onMarkUnpaid,
}: {
  cost: MonthlyCost;
  rank: number;
  maxAmount: number;
  currentMonthItem?: PayableReceivable;
  onUpdate: (patch: Partial<MonthlyCost>) => void;
  onRemove: () => void;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
}) {
  const currentMonth = monthKey(todayISO());
  const installmentIndex = costInstallmentIndexForMonth(c, currentMonth);
  const installmentEnded =
    c.installments && installmentIndex !== null && installmentIndex > c.installments.total;
  const isPaid = currentMonthItem?.paid ?? false;

  return (
    <li className="rounded-xl border border-border bg-surface-2/40 p-3">
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-orange-bright w-5 pt-2 shrink-0">
          #{rank}
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Input
              value={c.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="flex-1 min-w-[140px]"
            />
            <Input
              type="number"
              value={c.amount}
              onChange={(e) => onUpdate({ amount: Number(e.target.value) || 0 })}
              className="w-[110px] text-right tabular-nums"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={DEFAULT_EXPENSE_CATEGORIES.includes(c.category) ? c.category : "Outros"}
              onChange={(e) => onUpdate({ category: e.target.value })}
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
                  onUpdate({
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
                onChange={(e) => onUpdate({ active: e.target.checked })}
                className="accent-orange"
              />
              Ativo
            </label>
            <button
              onClick={onRemove}
              className="ml-auto text-text-muted hover:text-red p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
              <input
                type="checkbox"
                checked={!!c.installments}
                onChange={(e) =>
                  onUpdate({
                    installments: e.target.checked
                      ? { total: 12, startMonth: currentMonth }
                      : undefined,
                  })
                }
                className="accent-orange"
              />
              Parcelado
            </label>
            {c.installments && (
              <>
                <label className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                  Nº parcelas
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={c.installments.total}
                    onChange={(e) =>
                      onUpdate({
                        installments: {
                          ...c.installments!,
                          total: Math.min(120, Math.max(1, Number(e.target.value) || 1)),
                        },
                      })
                    }
                    className="w-16 text-center py-1"
                  />
                </label>
                {installmentIndex !== null && (
                  <Badge tone={installmentEnded ? "neutral" : "orange"}>
                    {installmentEnded
                      ? "Parcelamento concluído"
                      : `Parcela ${installmentIndex}/${c.installments.total}`}
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <ProgressBar value={c.amount} max={maxAmount} />
            {isPaid ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge tone="positive">
                  Pago{currentMonthItem?.paidDate ? ` em ${formatDateBR(currentMonthItem.paidDate)}` : ""}
                </Badge>
                <button onClick={onMarkUnpaid} title="Desfazer" className="text-text-muted hover:text-text p-1">
                  <RotateCcw size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={onMarkPaid}
                disabled={installmentEnded || !c.active}
                className="flex items-center gap-1.5 rounded-lg border border-green/40 bg-green/10 text-green px-2.5 py-1.5 text-xs font-semibold hover:bg-green/20 whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={14} />
                Pago
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
