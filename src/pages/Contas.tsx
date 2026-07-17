import { useMemo, useState } from "react";
import { CheckCircle2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useFinanceStore } from "../store/useFinanceStore";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  type PayableReceivableType,
  type PayableReceivable,
} from "../types";
import { Badge, Button, Card, EmptyState, Input, Select, SectionTitle, StatTile } from "../components/ui";
import { formatBRL } from "../lib/format";
import { daysUntil, formatDateBR, todayISO } from "../lib/date";
import { getOverdue, getUpcoming } from "../lib/finance";

type ViewFilter = "30dias" | "vencidas" | "todas";

export function Contas() {
  const { items, monthlyCosts, addItem, addInstallmentPlan, updateItem, removeItem, markItemPaid, markItemUnpaid } =
    useFinanceStore();
  const [type, setType] = useState<PayableReceivableType>("receber");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("30dias");
  const [showForm, setShowForm] = useState(false);

  const upcoming = getUpcoming(items, 30);
  const overdue = getOverdue(items);
  const costById = useMemo(
    () => new Map(monthlyCosts.map((c) => [c.id, c])),
    [monthlyCosts]
  );

  const list = useMemo(() => {
    let base = items.filter((i) => i.type === type);
    if (viewFilter === "30dias") {
      base = base.filter((i) => !i.paid && daysUntil(i.dueDate) <= 30 && daysUntil(i.dueDate) >= 0);
    } else if (viewFilter === "vencidas") {
      base = base.filter((i) => !i.paid && daysUntil(i.dueDate) < 0);
    }
    return base.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [items, type, viewFilter]);

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
          subtitle="Contas de custos fixos/variáveis são geradas automaticamente todo mês"
          action={
            <Button onClick={() => setShowForm((v) => !v)}>
              <span className="flex items-center gap-1.5">
                <Plus size={16} /> {showForm ? "Fechar" : "Nova conta"}
              </span>
            </Button>
          }
        />

        {showForm && (
          <NewAccountForm
            defaultType={type}
            onCreate={(form) => {
              if (form.installments > 1) {
                addInstallmentPlan(
                  {
                    counterparty: form.counterparty,
                    type: form.type,
                    category: form.category,
                    amount: form.amount,
                  },
                  form.description,
                  form.dueDate,
                  form.installments,
                  form.installmentsPaid + 1
                );
              } else {
                addItem({
                  description: form.description,
                  counterparty: form.counterparty,
                  type: form.type,
                  category: form.category,
                  amount: form.amount,
                  dueDate: form.dueDate,
                  paid: false,
                });
              }
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

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
            <table className="w-full text-sm min-w-[880px]">
              <thead>
                <tr className="text-left text-text-muted text-xs uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Descrição</th>
                  <th className="px-2 py-2 font-medium">Contraparte</th>
                  <th className="px-2 py-2 font-medium">Vencimento</th>
                  <th className="px-2 py-2 font-medium text-right">Valor</th>
                  <th className="px-2 py-2 font-medium">Origem</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    sourceCostName={item.sourceCostId ? costById.get(item.sourceCostId)?.name : undefined}
                    onUpdate={(patch) => updateItem(item.id, patch)}
                    onRemove={() => removeItem(item.id)}
                    onMarkPaid={() => markItemPaid(item.id)}
                    onMarkUnpaid={() => markItemUnpaid(item.id)}
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

interface NewAccountFormValue {
  description: string;
  counterparty: string;
  type: PayableReceivableType;
  category: string;
  amount: number;
  dueDate: string;
  installments: number;
  installmentsPaid: number;
}

function NewAccountForm({
  defaultType,
  onCreate,
  onCancel,
}: {
  defaultType: PayableReceivableType;
  onCreate: (v: NewAccountFormValue) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<PayableReceivableType>(defaultType);
  const [description, setDescription] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [category, setCategory] = useState(
    defaultType === "pagar" ? DEFAULT_EXPENSE_CATEGORIES[0] : DEFAULT_INCOME_CATEGORIES[0]
  );
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState(todayISO());
  const [parcelado, setParcelado] = useState(false);
  const [installments, setInstallments] = useState(2);
  const [installmentsPaid, setInstallmentsPaid] = useState(0);

  const categories = type === "pagar" ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  function handleSubmit() {
    if (description.trim() === "" || amount <= 0) return;
    const total = parcelado ? Math.max(1, Math.min(12, installments)) : 1;
    onCreate({
      description: description.trim(),
      counterparty: counterparty.trim(),
      type,
      category,
      amount,
      dueDate,
      installments: total,
      installmentsPaid: parcelado ? Math.max(0, Math.min(total - 1, installmentsPaid)) : 0,
    });
  }

  return (
    <div className="mb-5 rounded-xl border border-orange/30 bg-surface-2/40 p-4 space-y-4">
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        <button
          onClick={() => {
            setType("receber");
            setCategory(DEFAULT_INCOME_CATEGORIES[0]);
          }}
          className={`px-4 py-1.5 text-sm ${
            type === "receber" ? "bg-orange text-black font-semibold" : "text-text-muted hover:bg-surface-2"
          }`}
        >
          A Receber
        </button>
        <button
          onClick={() => {
            setType("pagar");
            setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
          }}
          className={`px-4 py-1.5 text-sm ${
            type === "pagar" ? "bg-orange text-black font-semibold" : "text-text-muted hover:bg-surface-2"
          }`}
        >
          A Pagar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-muted block mb-1">Descrição</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Fatura do cliente, compra de equipamento..."
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Contraparte</label>
          <Input
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder="Cliente ou fornecedor"
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Categoria</label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full">
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">
            {parcelado ? "Valor de cada parcela" : "Valor"}
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-full text-right tabular-nums"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Data de vencimento</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full"
          />
          {parcelado && (
            <p className="text-xs text-text-muted mt-1">
              Vencimento da parcela {Math.min(12, Math.max(1, installmentsPaid + 1))}
            </p>
          )}
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={parcelado}
              onChange={(e) => setParcelado(e.target.checked)}
              className="accent-orange"
            />
            Parcelado
          </label>
        </div>
        {parcelado && (
          <>
            <div>
              <label className="text-xs text-text-muted block mb-1">Nº de parcelas (1-12)</label>
              <Input
                type="number"
                min={1}
                max={12}
                value={installments}
                onChange={(e) => {
                  const total = Math.max(1, Math.min(12, Number(e.target.value) || 1));
                  setInstallments(total);
                  setInstallmentsPaid((paid) => Math.min(paid, total - 1));
                }}
                className="w-24"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Parcelas já pagas</label>
              <Input
                type="number"
                min={0}
                max={Math.max(0, installments - 1)}
                value={installmentsPaid}
                onChange={(e) =>
                  setInstallmentsPaid(
                    Math.max(0, Math.min(installments - 1, Number(e.target.value) || 0))
                  )
                }
                className="w-24"
              />
              <p className="text-xs text-text-muted mt-1">
                Faltam {installments - installmentsPaid} de {installments}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={description.trim() === "" || amount <= 0}>
          {parcelado
            ? `Criar ${installments - installmentsPaid} parcela(s) restante(s)`
            : "Criar conta"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  sourceCostName,
  onUpdate,
  onRemove,
  onMarkPaid,
  onMarkUnpaid,
}: {
  item: PayableReceivable;
  sourceCostName?: string;
  onUpdate: (patch: Partial<PayableReceivable>) => void;
  onRemove: () => void;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
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
        {sourceCostName ? (
          <div className="flex flex-wrap gap-1">
            <Badge tone="orange">Custo: {sourceCostName}</Badge>
            {item.installmentTotal && (
              <Badge tone="neutral">
                Parcela {item.installmentIndex}/{item.installmentTotal}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
              <input
                type="checkbox"
                checked={!!item.installmentTotal}
                onChange={(e) =>
                  onUpdate(
                    e.target.checked
                      ? { installmentIndex: 1, installmentTotal: 2 }
                      : {
                          installmentIndex: undefined,
                          installmentTotal: undefined,
                          installmentGroupId: undefined,
                        }
                  )
                }
                className="accent-orange"
              />
              Parcelado
            </label>
            {!!item.installmentTotal && (
              <div className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                <Input
                  type="number"
                  min={1}
                  max={item.installmentTotal}
                  value={item.installmentIndex ?? 1}
                  onChange={(e) => {
                    const idx = Math.min(
                      item.installmentTotal ?? 1,
                      Math.max(1, Number(e.target.value) || 1)
                    );
                    onUpdate({ installmentIndex: idx });
                  }}
                  className="w-11 text-center py-1 px-1"
                />
                <span>de</span>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={item.installmentTotal}
                  onChange={(e) => {
                    const total = Math.min(12, Math.max(1, Number(e.target.value) || 1));
                    onUpdate({
                      installmentTotal: total,
                      installmentIndex: Math.min(item.installmentIndex ?? 1, total),
                    });
                  }}
                  className="w-11 text-center py-1 px-1"
                />
              </div>
            )}
          </div>
        )}
      </td>
      <td className="px-2 py-2">
        {item.paid ? (
          <div className="flex items-center gap-2">
            <Badge tone="positive">
              {item.type === "pagar" ? "Pago" : "Recebido"}
              {item.paidDate ? ` em ${formatDateBR(item.paidDate)}` : ""}
            </Badge>
            <button
              onClick={onMarkUnpaid}
              title="Desfazer"
              className="text-text-muted hover:text-text p-1"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onMarkPaid}
            className="flex items-center gap-1.5 rounded-lg border border-green/40 bg-green/10 text-green px-2.5 py-1.5 text-xs font-semibold hover:bg-green/20 whitespace-nowrap"
          >
            <CheckCircle2 size={14} />
            {item.type === "pagar" ? "Já paguei" : "Já recebi"}
          </button>
        )}
      </td>
      <td className="px-2 py-2">
        <button onClick={onRemove} className="text-text-muted hover:text-red p-1">
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}
