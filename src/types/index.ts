export type TxType = "entrada" | "saida";
export type TxStatus = "realizado" | "previsto";

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  type: TxType;
  category: string;
  amount: number; // sempre positivo, o sinal é dado por `type`
  status: TxStatus;
}

export type CostType = "fixo" | "variavel";

export interface CostInstallments {
  total: number; // total de parcelas
  startMonth: string; // yyyy-MM da primeira parcela
}

export interface MonthlyCost {
  id: string;
  name: string;
  type: CostType;
  category: string;
  amount: number;
  active: boolean;
  dueDay: number; // dia do mês (1-31) em que o custo vence
  installments?: CostInstallments; // se definido, o custo só é cobrado durante essa janela
}

export type PayableReceivableType = "pagar" | "receber";

export interface PayableReceivable {
  id: string;
  description: string;
  counterparty: string;
  type: PayableReceivableType;
  category: string;
  amount: number;
  dueDate: string; // ISO yyyy-mm-dd
  paid: boolean;
  paidDate?: string; // ISO yyyy-mm-dd, preenchido ao marcar como pago
  transactionId?: string; // transação de fluxo de caixa gerada ao marcar como pago
  installmentGroupId?: string; // agrupa parcelas da mesma compra/conta
  installmentIndex?: number; // posição da parcela (1-based)
  installmentTotal?: number; // total de parcelas do grupo
  sourceCostId?: string; // id do MonthlyCost que gerou esta conta automaticamente
}

export interface AppState {
  initialBalance: number;
  initialBalanceDate: string;
  transactions: Transaction[];
  monthlyCosts: MonthlyCost[];
  items: PayableReceivable[];
}

export const DEFAULT_INCOME_CATEGORIES = [
  "Vendas",
  "Serviços",
  "Outras Receitas",
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Folha de Pagamento",
  "Aluguel",
  "Fornecedores",
  "Marketing",
  "Impostos",
  "Software/Assinaturas",
  "Utilidades",
  "Outros",
];
