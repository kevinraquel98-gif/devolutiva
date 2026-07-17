import type { AppState, MonthlyCost, PayableReceivable, Transaction } from "../types";
import { uid } from "../lib/id";
import { todayISO, addDaysISO, addMonthsISO } from "../lib/date";

function tx(daysAgo: number, type: Transaction["type"], category: string, amount: number, description: string, status: Transaction["status"] = "realizado"): Transaction {
  return {
    id: uid(),
    date: addDaysISO(todayISO(), -daysAgo),
    description,
    type,
    category,
    amount,
    status,
  };
}

export function buildSeedTransactions(): Transaction[] {
  const list: Transaction[] = [];
  for (let m = 0; m < 6; m++) {
    const base = m * 30;
    list.push(tx(base + 2, "entrada", "Vendas", 42000 + m * 1500, "Recebimento de vendas do mês"));
    list.push(tx(base + 5, "entrada", "Serviços", 8000, "Contrato de serviço recorrente"));
    list.push(tx(base + 8, "saida", "Folha de Pagamento", 21000, "Folha de pagamento"));
    list.push(tx(base + 10, "saida", "Aluguel", 4200, "Aluguel do escritório"));
    list.push(tx(base + 12, "saida", "Fornecedores", 9800 + (m % 3) * 900, "Pagamento a fornecedores"));
    list.push(tx(base + 15, "saida", "Marketing", 3200, "Campanhas de marketing"));
    list.push(tx(base + 18, "saida", "Impostos", 5100, "Impostos e tributos"));
    list.push(tx(base + 20, "saida", "Software/Assinaturas", 980, "Assinaturas de software"));
    list.push(tx(base + 22, "saida", "Utilidades", 620, "Água, luz, internet"));
  }
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

export function buildSeedMonthlyCosts(): MonthlyCost[] {
  const mk = (
    name: string,
    type: MonthlyCost["type"],
    category: string,
    amount: number,
    dueDay: number
  ): MonthlyCost => ({
    id: uid(),
    name,
    type,
    category,
    amount,
    active: true,
    dueDay,
  });
  return [
    mk("Folha de Pagamento", "fixo", "Folha de Pagamento", 21000, 5),
    mk("Aluguel do escritório", "fixo", "Aluguel", 4200, 10),
    mk("Assinaturas de software", "fixo", "Software/Assinaturas", 980, 15),
    mk("Água, luz, internet", "fixo", "Utilidades", 620, 20),
    mk("Contador", "fixo", "Outros", 700, 10),
    mk("Fornecedores (matéria-prima)", "variavel", "Fornecedores", 9800, 12),
    mk("Comissões de vendas", "variavel", "Folha de Pagamento", 2600, 5),
    mk("Marketing / Ads", "variavel", "Marketing", 3200, 15),
    mk("Frete e logística", "variavel", "Outros", 1400, 18),
    mk("Impostos sobre vendas", "variavel", "Impostos", 5100, 20),
  ];
}

export function buildSeedItems(): PayableReceivable[] {
  const mkR = (
    description: string,
    counterparty: string,
    type: PayableReceivable["type"],
    category: string,
    amount: number,
    days: number,
    paid = false
  ): PayableReceivable => ({
    id: uid(),
    description,
    counterparty,
    type,
    category,
    amount,
    dueDate: addDaysISO(todayISO(), days),
    paid,
  });
  return [
    mkR("Fatura cliente #1042", "Cliente Alfa Ltda", "receber", "Vendas", 12500, 3),
    mkR("Fatura cliente #1043", "Cliente Beta S.A.", "receber", "Serviços", 8700, 9),
    mkR("Contrato mensal", "Cliente Gama ME", "receber", "Serviços", 6300, 16),
    mkR("Fatura cliente #1044", "Cliente Delta EIRELI", "receber", "Vendas", 15400, 27),
    mkR("Venda à vista pendente de compensação", "Cliente Épsilon", "receber", "Vendas", 3200, 40),
    mkR("Fornecedor de insumos", "Fornecedor Central", "pagar", "Fornecedores", 9800, 5),
  ];
}

export function buildSeedState(): AppState {
  return {
    initialBalance: 18500,
    initialBalanceDate: addMonthsISO(todayISO(), -6),
    transactions: buildSeedTransactions(),
    monthlyCosts: buildSeedMonthlyCosts(),
    items: buildSeedItems(),
  };
}
