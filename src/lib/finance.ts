import type { AppState, MonthlyCost, PayableReceivable, Transaction } from "../types";
import { addMonthsISO, daysUntil, monthKey, monthsBetween, todayISO } from "./date";

export function getCashPosition(state: AppState): number {
  const today = todayISO();
  const realized = state.transactions.filter(
    (t) => t.status === "realizado" && t.date <= today
  );
  const inflow = realized
    .filter((t) => t.type === "entrada")
    .reduce((sum, t) => sum + t.amount, 0);
  const outflow = realized
    .filter((t) => t.type === "saida")
    .reduce((sum, t) => sum + t.amount, 0);
  return state.initialBalance + inflow - outflow;
}

export interface MonthSummary {
  month: string;
  label: string;
  receita: number;
  saidas: number;
  resultado: number;
  margem: number;
}

export function getMonthlyTransactionSummary(
  transactions: Transaction[],
  month: string
): Omit<MonthSummary, "month" | "label"> {
  const inMonth = transactions.filter(
    (t) => t.status === "realizado" && monthKey(t.date) === month
  );
  const receita = inMonth
    .filter((t) => t.type === "entrada")
    .reduce((s, t) => s + t.amount, 0);
  const saidas = inMonth
    .filter((t) => t.type === "saida")
    .reduce((s, t) => s + t.amount, 0);
  const resultado = receita - saidas;
  const margem = receita > 0 ? (resultado / receita) * 100 : 0;
  return { receita, saidas, resultado, margem };
}

export function getLastNMonthsSummary(
  transactions: Transaction[],
  n = 6
): MonthSummary[] {
  const today = todayISO();
  const months: MonthSummary[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const refDate = addMonthsISO(today, -i);
    const key = monthKey(refDate);
    const summary = getMonthlyTransactionSummary(transactions, key);
    months.push({
      month: key,
      label: refDate,
      ...summary,
    });
  }
  return months;
}

export function getCashFlowSeries(state: AppState, months = 6) {
  const summaries = getLastNMonthsSummary(state.transactions, months);
  let running =
    state.initialBalance +
    state.transactions
      .filter(
        (t) =>
          t.status === "realizado" &&
          monthKey(t.date) < summaries[0]?.month
      )
      .reduce((s, t) => s + (t.type === "entrada" ? t.amount : -t.amount), 0);

  return summaries.map((m) => {
    running += m.resultado;
    return { ...m, saldoAcumulado: running };
  });
}

/** Índice da parcela (1-based) que `cost` representa em `month`, ou null se não parcelado. */
export function costInstallmentIndexForMonth(cost: MonthlyCost, month: string): number | null {
  if (!cost.installments) return null;
  return monthsBetween(cost.installments.startMonth, month) + 1;
}

/** Se o custo está de fato em cobrança em `month` (ativo e, se parcelado, dentro da janela). */
export function isCostActiveInMonth(cost: MonthlyCost, month: string = monthKey(todayISO())): boolean {
  if (!cost.active) return false;
  const idx = costInstallmentIndexForMonth(cost, month);
  if (idx === null) return true;
  return idx >= 1 && idx <= (cost.installments?.total ?? 0);
}

export function getActiveCosts(
  monthlyCosts: MonthlyCost[],
  type: MonthlyCost["type"],
  month: string = monthKey(todayISO())
) {
  return monthlyCosts.filter((c) => c.type === type && isCostActiveInMonth(c, month));
}

export function getTotalFixedCosts(monthlyCosts: MonthlyCost[], month?: string): number {
  return getActiveCosts(monthlyCosts, "fixo", month).reduce((s, c) => s + c.amount, 0);
}

export function getTotalVariableCosts(monthlyCosts: MonthlyCost[], month?: string): number {
  return getActiveCosts(monthlyCosts, "variavel", month).reduce((s, c) => s + c.amount, 0);
}

export function getRankedCosts(monthlyCosts: MonthlyCost[], month?: string) {
  const fixed = [...getActiveCosts(monthlyCosts, "fixo", month)].sort(
    (a, b) => b.amount - a.amount
  );
  const variable = [...getActiveCosts(monthlyCosts, "variavel", month)].sort(
    (a, b) => b.amount - a.amount
  );
  return { fixed, variable };
}

export function getAverageMonthlyRevenue(
  transactions: Transaction[],
  months = 3
): number {
  const summaries = getLastNMonthsSummary(transactions, months).filter(
    (m) => m.receita > 0
  );
  if (summaries.length === 0) return 0;
  const total = summaries.reduce((s, m) => s + m.receita, 0);
  return total / summaries.length;
}

export interface BreakEvenResult {
  fixedCosts: number;
  variableCosts: number;
  revenue: number;
  contributionMarginRatio: number;
  breakEvenRevenue: number;
  gapToBreakEven: number;
}

export function getBreakEven(
  monthlyCosts: MonthlyCost[],
  transactions: Transaction[]
): BreakEvenResult {
  const fixedCosts = getTotalFixedCosts(monthlyCosts);
  const variableCosts = getTotalVariableCosts(monthlyCosts);
  const revenue = getAverageMonthlyRevenue(transactions, 3);
  const variableRatio = revenue > 0 ? variableCosts / revenue : 0;
  const contributionMarginRatio = 1 - variableRatio;
  const breakEvenRevenue =
    contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : Infinity;
  return {
    fixedCosts,
    variableCosts,
    revenue,
    contributionMarginRatio: contributionMarginRatio * 100,
    breakEvenRevenue,
    gapToBreakEven: breakEvenRevenue - revenue,
  };
}

export interface RunwayResult {
  cashPosition: number;
  monthlyCosts: number;
  monthlyRevenue: number;
  burnRate: number;
  months: number;
  isProfitable: boolean;
}

export function getRunway(state: AppState): RunwayResult {
  const cashPosition = getCashPosition(state);
  const fixedCosts = getTotalFixedCosts(state.monthlyCosts);
  const variableCosts = getTotalVariableCosts(state.monthlyCosts);
  const totalMonthlyCosts = fixedCosts + variableCosts;
  const monthlyRevenue = getAverageMonthlyRevenue(state.transactions, 3);
  const burnRate = totalMonthlyCosts - monthlyRevenue;
  const isProfitable = burnRate <= 0;
  const months = isProfitable
    ? Infinity
    : cashPosition > 0
    ? cashPosition / burnRate
    : 0;
  return {
    cashPosition,
    monthlyCosts: totalMonthlyCosts,
    monthlyRevenue,
    burnRate,
    months,
    isProfitable,
  };
}

export function getUpcoming(
  items: PayableReceivable[],
  days = 30
): { payables: PayableReceivable[]; receivables: PayableReceivable[]; totalPayable: number; totalReceivable: number } {
  const pending = items.filter((i) => !i.paid && daysUntil(i.dueDate) <= days);
  const payables = pending
    .filter((i) => i.type === "pagar")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const receivables = pending
    .filter((i) => i.type === "receber")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return {
    payables,
    receivables,
    totalPayable: payables.reduce((s, i) => s + i.amount, 0),
    totalReceivable: receivables.reduce((s, i) => s + i.amount, 0),
  };
}

export function getOverdue(items: PayableReceivable[]): PayableReceivable[] {
  return items.filter((i) => !i.paid && daysUntil(i.dueDate) < 0);
}
