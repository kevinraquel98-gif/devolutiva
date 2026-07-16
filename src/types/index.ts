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

export interface MonthlyCost {
  id: string;
  name: string;
  type: CostType;
  category: string;
  amount: number;
  active: boolean;
}

export type PayableReceivableType = "pagar" | "receber";

export interface PayableReceivable {
  id: string;
  description: string;
  counterparty: string;
  type: PayableReceivableType;
  amount: number;
  dueDate: string; // ISO yyyy-mm-dd
  paid: boolean;
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
