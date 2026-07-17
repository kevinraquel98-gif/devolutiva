import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFinanceStore } from "../store/useFinanceStore";
import {
  getCashFlowSeries,
  getCashPosition,
  getMonthlyTransactionSummary,
  getRunway,
  getTotalFixedCosts,
  getTotalVariableCosts,
  getUpcoming,
} from "../lib/finance";
import { formatBRL, formatBRLCompact, formatPercent } from "../lib/format";
import { formatMonthBR, monthKey, todayISO, formatDateBR } from "../lib/date";
import { Badge, Card, ProgressBar, SectionTitle, StatTile } from "../components/ui";
import type { TabKey } from "../components/Layout";

export function Dashboard({ onNavigate }: { onNavigate: (t: TabKey) => void }) {
  const state = useFinanceStore();
  const cash = getCashPosition(state);
  const currentMonth = monthKey(todayISO());
  const dre = getMonthlyTransactionSummary(state.transactions, currentMonth);
  const series = getCashFlowSeries(state, 6);
  const runway = getRunway(state);
  const upcoming = getUpcoming(state.items, 30);

  const chartData = series.map((m) => ({
    label: formatMonthBR(m.label),
    Entradas: m.receita,
    Saídas: m.saidas,
    Saldo: m.saldoAcumulado,
  }));

  const totalCustosMes = getTotalFixedCosts(state.monthlyCosts) + getTotalVariableCosts(state.monthlyCosts);

  return (
    <div className="space-y-6">
      <Card glow className="relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-orange/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted font-medium">
              Posição de Caixa Hoje · {formatDateBR(todayISO())}
            </p>
            <p
              className={`mt-2 text-4xl md:text-5xl font-black tabular-nums ${
                cash >= 0 ? "text-orange-bright" : "text-red"
              }`}
            >
              {formatBRL(cash)}
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Saldo inicial de {formatBRL(state.initialBalance)} em{" "}
              {formatDateBR(state.initialBalanceDate)} + movimentações realizadas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge tone={runway.isProfitable ? "positive" : "warning"}>
              {runway.isProfitable
                ? "Fluxo operacional positivo"
                : `Runway: ${runway.months.toFixed(1)} meses`}
            </Badge>
            <Badge tone={upcoming.totalReceivable >= upcoming.totalPayable ? "positive" : "negative"}>
              Próx. 30d: {formatBRLCompact(upcoming.totalReceivable - upcoming.totalPayable)}
            </Badge>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Resumo" subtitle={`Referente a ${formatMonthBR(currentMonth + "-01")}`} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            label="Saída"
            value={formatBRL(dre.saidas)}
            tone="negative"
            hint="Total pago/saído no mês atual"
          />
          <StatTile
            label="Caixa"
            value={formatBRL(cash)}
            tone={cash >= 0 ? "positive" : "negative"}
            hint="Posição de caixa atual"
          />
          <StatTile
            label="Total"
            value={formatBRL(totalCustosMes)}
            hint="Custos Fixos + Custos Variáveis do mês"
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Receita do mês"
          value={formatBRL(dre.receita)}
          hint="Entradas realizadas no mês atual"
        />
        <StatTile
          label="Saídas do mês"
          value={formatBRL(dre.saidas)}
          hint="Custos e despesas realizadas"
        />
        <StatTile
          label="Resultado do mês"
          value={formatBRL(dre.resultado)}
          tone={dre.resultado >= 0 ? "positive" : "negative"}
          hint="Receita − Saídas"
        />
        <StatTile
          label="Margem do mês"
          value={formatPercent(dre.margem)}
          tone={dre.margem >= 0 ? "positive" : "negative"}
          hint="Resultado / Receita"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Fluxo de Caixa — últimos 6 meses"
            subtitle="Entradas, saídas e saldo acumulado"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6a00" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff6a00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="label" stroke="#9a9a94" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#9a9a94"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatBRLCompact(v)}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1c1c1c",
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                    color: "#f2f2f0",
                  }}
                  formatter={(value) => formatBRL(Number(value))}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9a9a94" }} />
                <Bar dataKey="Entradas" fill="#3ddc84" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="Saídas" fill="#ff4d4d" radius={[4, 4, 0, 0]} barSize={18} />
                <Area
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#ff8c1a"
                  fill="url(#saldoGradient)"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="DRE Resumido"
            subtitle={`Referente a ${formatMonthBR(currentMonth + "-01")}`}
          />
          <div className="space-y-3">
            <DreRow label="Receita Bruta" value={dre.receita} />
            <DreRow label="(-) Saídas Totais" value={-dre.saidas} />
            <div className="h-px bg-border my-2" />
            <DreRow label="Resultado Líquido" value={dre.resultado} bold />
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-text-muted">Margem Líquida</span>
              <span className={`font-semibold ${dre.margem >= 0 ? "text-green" : "text-red"}`}>
                {formatPercent(dre.margem)}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate("fluxo")}
            className="mt-4 text-xs text-orange-bright hover:underline"
          >
            Ver todas as movimentações →
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle
            title="Contas a Receber — 30 dias"
            subtitle={`Total: ${formatBRL(upcoming.totalReceivable)}`}
            action={
              <button
                onClick={() => onNavigate("contas")}
                className="text-xs text-orange-bright hover:underline"
              >
                Ver todas →
              </button>
            }
          />
          <UpcomingList items={upcoming.receivables} empty="Nenhuma conta a receber nos próximos 30 dias." />
        </Card>
        <Card>
          <SectionTitle
            title="Contas a Pagar — 30 dias"
            subtitle={`Total: ${formatBRL(upcoming.totalPayable)}`}
            action={
              <button
                onClick={() => onNavigate("contas")}
                className="text-xs text-orange-bright hover:underline"
              >
                Ver todas →
              </button>
            }
          />
          <UpcomingList items={upcoming.payables} empty="Nenhuma conta a pagar nos próximos 30 dias." />
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Saúde Financeira"
          subtitle="Indicadores rápidos para decisão"
          action={
            <button
              onClick={() => onNavigate("crise")}
              className="text-xs text-orange-bright hover:underline"
            >
              Ir para Modo Crise →
            </button>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-text-muted mb-2">Custos mensais vs Receita média</p>
            <ProgressBar
              value={runway.monthlyCosts}
              max={Math.max(runway.monthlyCosts, runway.monthlyRevenue)}
              tone={runway.isProfitable ? "green" : "red"}
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>Custos: {formatBRLCompact(runway.monthlyCosts)}</span>
              <span>Receita: {formatBRLCompact(runway.monthlyRevenue)}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-text-muted mb-1">Runway (caixa ÷ queima mensal)</p>
            <p className={`text-2xl font-bold ${runway.isProfitable ? "text-green" : "text-yellow"}`}>
              {runway.isProfitable ? "Sem risco" : `${runway.months.toFixed(1)} meses`}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted mb-1">Queima de caixa mensal</p>
            <p className={`text-2xl font-bold ${runway.burnRate <= 0 ? "text-green" : "text-red"}`}>
              {formatBRL(Math.max(0, runway.burnRate))}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DreRow({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? "font-semibold text-text" : "text-text-muted"}>{label}</span>
      <span
        className={`tabular-nums ${bold ? "font-bold text-lg" : ""} ${
          value < 0 ? "text-red" : bold ? (value >= 0 ? "text-orange-bright" : "text-red") : "text-text"
        }`}
      >
        {formatBRL(value)}
      </span>
    </div>
  );
}

function UpcomingList({
  items,
  empty,
}: {
  items: { id: string; description: string; counterparty: string; dueDate: string; amount: number }[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-text-muted py-6 text-center">{empty}</p>;
  }
  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {items.slice(0, 6).map((i) => (
        <li
          key={i.id}
          className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
        >
          <div className="min-w-0">
            <p className="text-sm text-text truncate">{i.description}</p>
            <p className="text-xs text-text-muted truncate">
              {i.counterparty} · vence {formatDateBR(i.dueDate)}
            </p>
          </div>
          <span className="text-sm font-semibold tabular-nums shrink-0">
            {formatBRL(i.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
