import { useEffect, useState } from "react";
import { Layout, type TabKey } from "./components/Layout";
import { CashPill } from "./components/CashPill";
import { Dashboard } from "./pages/Dashboard";
import { FluxoCaixa } from "./pages/FluxoCaixa";
import { Custos } from "./pages/Custos";
import { Contas } from "./pages/Contas";
import { Importar } from "./pages/Importar";
import { Crise } from "./pages/Crise";
import { useFinanceStore } from "./store/useFinanceStore";

function App() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const syncCostPayables = useFinanceStore((s) => s.syncCostPayables);

  useEffect(() => {
    syncCostPayables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout active={tab} onChange={setTab} headerRight={<CashPill />}>
      {tab === "dashboard" && <Dashboard onNavigate={setTab} />}
      {tab === "fluxo" && <FluxoCaixa />}
      {tab === "custos" && <Custos />}
      {tab === "contas" && <Contas />}
      {tab === "importar" && <Importar />}
      {tab === "crise" && <Crise />}
    </Layout>
  );
}

export default App;
