# Devolutiva Financeira

Dashboard financeiro completo — fluxo de caixa, DRE resumido, contas a pagar/receber,
custos fixos/variáveis, importação de extratos e modo crise (break-even + runway).

## Funcionalidades

- **Dashboard**: posição de caixa em destaque, DRE resumido, receita/margem/resultado do mês, gráfico de fluxo de caixa (6 meses).
- **Fluxo de Caixa**: tabela editável de entradas e saídas, com filtros e busca.
- **Custos Fixos/Variáveis**: cadastro editável dos gastos mensais, ranqueados por valor.
- **Contas a Pagar/Receber**: visão dos próximos 30 dias, vencidas e histórico completo.
- **Importar Extrato**: importação de extratos bancários em `.xlsx`, `.xls` ou `.csv` com mapeamento de colunas.
- **Modo Crise**: ponto de equilíbrio (break-even), runway (meses de caixa) e ranking dos maiores custos.

Os dados ficam salvos localmente no navegador (localStorage) — nenhuma informação é enviada para servidores externos.

## Rodando localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
npm run preview
```
