import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Flame, ShieldCheck, TrendingDown } from "lucide-react";
import { useFinanceStore } from "../store/useFinanceStore";
import { getBreakEven, getRankedCosts, getRunway } from "../lib/finance";
import { formatBRL, formatBRLCompact, formatPercent } from "../lib/format";
import { Badge, Card, ProgressBar, SectionTitle, StatTile } from "../components/ui";

export function Crise() {
  const state = useFinanceStore();
  const breakEven = getBreakEven(state.monthlyCosts, state.transactions);
  const runway = getRunway(state);
  const { fixed, variable } = getRankedCosts(state.monthlyCosts);

  const rankedAll = [
    ...fixed.map((c) => ({ ...c, kind: "Fixo" as const })),
    ...variable.map((c) => ({ ...c, kind: "Variável" as const })),
  ]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const chartData = rankedAll.map((c) => ({
    name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name,
    Valor: c.amount,
    kind: c.kind,
  }));

  const revenueGapPct =
    breakEven.breakEvenRevenue > 0 && Number.isFinite(breakEven.breakEvenRevenue)
      ? (breakEven.revenue / breakEven.breakEvenRevenue) * 100
      : 100;

  const runwayTone = !runway.isProfitable
    ? runway.months < 3
      ? "negative"
      : runway.months < 6
      ? "warning"
      : "positive"
    : "positive";

  return (
    <div className="space-y-6">
      <Card
        glow
        className={`relative overflow-hidden border ${
          runway.isProfitable ? "border-green/30" : "border-red/40"
        }`}
      >
        <div className="flex items-center gap-3">
          {runway.isProfitable ? (
            <ShieldCheck className="text-green shrink-0" size={28} />
          ) : (
            <Flame className="text-red shrink-0" size={28} />
          )}
          <div>
            <p className="font-bold text-lg">
              {runway.isProfitable
                ? "Operação saudável — receita cobre os custos mensais"
                : "Atenção: os custos mensais superam a receita média"}
            </p>
            <p className="text-sm text-text-muted">
              Modo Crise: acompanhe ponto de equilíbrio, ranking de custos e fôlego de caixa.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatTile
          label="Break-even (faturamento p/ empatar)"
          value={Number.isFinite(breakEven.breakEvenRevenue) ? formatBRL(breakEven.breakEvenRevenue) : "—"}
          hint="Receita mensal necessária para resultado zero"
          size="lg"
        />
        <StatTile
          label="Receita média atual"
          value={formatBRL(breakEven.revenue)}
          tone={breakEven.revenue >= breakEven.breakEvenRevenue ? "positive" : "negative"}
          hint="Média dos últimos 3 meses realizados"
          size="lg"
        />
        <StatTile
          label="Runway"
          value={runway.isProfitable ? "Sem risco" : `${runway.months.toFixed(1)} meses`}
          tone={runwayTone}
          hint="Quanto tempo o caixa atual aguenta no ritmo de queima atual"
          size="lg"
        />
      </div>

      <Card>
        <SectionTitle
          title="Ponto de Equilíbrio (Break-even)"
          subtitle="Quanto sua empresa precisa faturar por mês para não ficar no vermelho"
        />
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Receita atual vs. necessária</span>
            <span className="font-semibold">{formatPercent(Math.min(999, revenueGapPct))}</span>
          </div>
          <ProgressBar
            value={breakEven.revenue}
            max={Math.max(breakEven.revenue, breakEven.breakEvenRevenue)}
            tone={breakEven.revenue >= breakEven.breakEvenRevenue ? "green" : "red"}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-sm">
            <MiniStat label="Custos Fixos" value={formatBRL(breakEven.fixedCosts)} />
            <MiniStat label="Custos Variáveis" value={formatBRL(breakEven.variableCosts)} />
            <MiniStat label="Margem de Contribuição" value={formatPercent(breakEven.contributionMarginRatio)} />
            <MiniStat
              label={breakEven.gapToBreakEven > 0 ? "Falta faturar" : "Acima do break-even"}
              value={formatBRL(Math.abs(breakEven.gapToBreakEven))}
              tone={breakEven.gapToBreakEven > 0 ? "negative" : "positive"}
            />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Runway — Fôlego de Caixa"
          subtitle="Meses até o caixa zerar no ritmo de queima atual"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div className="sm:col-span-2 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Caixa hoje</span>
              <span className="font-semibold">{formatBRL(runway.cashPosition)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Custo mensal total (fixo + variável)</span>
              <span className="font-semibold">{formatBRL(runway.monthlyCosts)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Receita média mensal</span>
              <span className="font-semibold">{formatBRL(runway.monthlyRevenue)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Queima de caixa mensal</span>
              <span className={`font-bold ${runway.burnRate > 0 ? "text-red" : "text-green"}`}>
                {runway.burnRate > 0 ? formatBRL(runway.burnRate) : "Caixa positivo"}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-2/50 p-6">
            <TrendingDown className={runway.isProfitable ? "text-green" : "text-red"} size={26} />
            <p className="text-3xl font-black mt-2 tabular-nums">
              {runway.isProfitable ? "∞" : runway.months.toFixed(1)}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {runway.isProfitable ? "meses de fôlego (sem queima)" : "meses até zerar o caixa"}
            </p>
          </div>
        </div>
        {!runway.isProfitable && runway.months < 6 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red/30 bg-red/5 p-3 text-sm text-red">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>
              Com menos de 6 meses de runway, priorize cortar os maiores custos abaixo ou acelerar
              a cobrança de contas a receber.
            </span>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle
          title="Custos Ranqueados"
          subtitle="Os 10 maiores gastos mensais — comece o corte por aqui"
        />
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
              <XAxis
                type="number"
                stroke="#9a9a94"
                fontSize={12}
                tickFormatter={(v) => formatBRLCompact(v)}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9a9a94"
                fontSize={12}
                width={140}
                tickLine={false}
                axisLine={false}
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
              <Bar dataKey="Valor" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.kind === "Fixo" ? "#ff6a00" : "#ff8c1a"} fillOpacity={entry.kind === "Fixo" ? 1 : 0.55} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 divide-y divide-border">
          {rankedAll.map((c, idx) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-orange-bright w-5 shrink-0">#{idx + 1}</span>
                <span className="truncate">{c.name}</span>
                <Badge tone={c.kind === "Fixo" ? "orange" : "neutral"}>{c.kind}</Badge>
              </div>
              <span className="font-semibold tabular-nums shrink-0">{formatBRL(c.amount)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass = tone === "positive" ? "text-green" : tone === "negative" ? "text-red" : "text-text";
  return (
    <div>
      <p className="text-text-muted text-xs">{label}</p>
      <p className={`font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
