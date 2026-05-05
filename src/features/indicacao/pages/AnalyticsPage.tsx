import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useApp } from "../AppContext";
import { PRODUTOS, STATUSES, VALOR_RECOMPENSA } from "../types";
import { Avatar } from "../components/Avatar";

const COLORS = ["#CCFF00", "#3b82f6", "#a855f7", "#f97316", "#ec4899", "#14b8a6"];

export function AnalyticsPage() {
  const { indicacoes, user, avatar, getAvatar } = useApp();

  const total = indicacoes.length;
  const assinados = indicacoes.filter((i) => i.status === "Contrato assinado");
  const recompensasPendentes = assinados.filter((i) => !i.recompensaPaga).length * VALOR_RECOMPENSA;
  const taxaConversao = total ? Math.round((assinados.length / total) * 100) : 0;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const indicacoesMes = indicacoes.filter((i) => new Date(i.criadoEm) >= inicioMes).length;

  const funilData = useMemo(
    () =>
      STATUSES.map((s) => ({
        status: s,
        qtd: indicacoes.filter((i) => i.status === s).length,
      })),
    [indicacoes],
  );

  const topIndicadores = useMemo(() => {
    const map = new Map<string, { id: string; name: string; convertidos: number; total: number }>();
    for (const i of indicacoes) {
      const id = i.criadoPorId;
      const m = map.get(id) ?? { id, name: i.criadoPorNome, convertidos: 0, total: 0 };
      m.total += 1;
      if (i.status === "Contrato assinado") m.convertidos += 1;
      map.set(id, m);
    }
    return Array.from(map.values())
      .sort((a, b) => b.convertidos - a.convertidos || b.total - a.total)
      .slice(0, 5);
  }, [indicacoes]);

  const produtoData = useMemo(
    () =>
      PRODUTOS.map((p) => ({
        name: p,
        value: indicacoes.filter((i) => i.produto === p).length,
      })).filter((d) => d.value > 0),
    [indicacoes],
  );

  const evolucaoMensal = useMemo(() => {
    const meses: { mes: string; qtd: number }[] = [];
    const now = new Date();
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      const qtd = indicacoes.filter((i) => {
        const di = new Date(i.criadoEm);
        return di.getFullYear() === d.getFullYear() && di.getMonth() === d.getMonth();
      }).length;
      meses.push({ mes: label, qtd });
    }
    return meses;
  }, [indicacoes]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="mt-1 text-sm text-[#AAAAAA]">
          Visão consolidada do programa de indicações.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de Indicações" value={total.toString()} />
        <KpiCard
          label="Recompensas Pendentes"
          value={`R$ ${recompensasPendentes.toLocaleString("pt-BR")}`}
          accent
        />
        <KpiCard label="Taxa de Conversão" value={`${taxaConversao}%`} />
        <KpiCard label="Indicações este Mês" value={indicacoesMes.toString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Funil de Status">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funilData} layout="vertical" margin={{ left: -10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid stroke="#1f1f1f" horizontal={false} />
                <XAxis type="number" stroke="#444" fontSize={11} />
                <YAxis dataKey="status" type="category" stroke="#AAA" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#aaa" }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="qtd" fill="#CCFF00" radius={[0, 6, 6, 0]} background={{ fill: "#1a1a1a", radius: 6 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Distribuição por Produto">
          <div className="flex flex-col">
            <div className="h-60">
            {produtoData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-[#666]">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={produtoData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    stroke="#1a1a1a"
                  >
                    {produtoData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid #2a2a2a",
                      borderRadius: 8,
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#aaa" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs">
              {produtoData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[#AAAAAA]">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Top Indicadores (convertidos)">
          <ul className="space-y-3">
            {topIndicadores.length === 0 && (
              <li className="text-sm text-[#666]">Sem dados</li>
            )}
            {topIndicadores.map((u, idx) => (
              <li key={u.name} className="flex items-center gap-2 sm:gap-3">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#2a2a2a] text-[10px] sm:text-[11px] font-bold text-white">
                  {idx + 1}
                </div>
                <Avatar name={u.name} size="sm" src={getAvatar(u.id)} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs sm:text-sm font-semibold text-white">{u.name}</div>
                  <div className="text-[10px] sm:text-[11px] text-[#AAAAAA] truncate">
                    {u.convertidos} conv. • {u.total} ind.
                  </div>
                </div>
                <div className="shrink-0 text-xs sm:text-sm font-bold text-[#CCFF00]">
                  R$ {(u.convertidos * VALOR_RECOMPENSA).toLocaleString("pt-BR")}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Evolução Mensal">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoMensal} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid stroke="#1f1f1f" />
                <XAxis dataKey="mes" stroke="#AAA" fontSize={11} tickMargin={4} />
                <YAxis stroke="#AAA" fontSize={11} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Line
                  type="monotone"
                  dataKey="qtd"
                  stroke="#CCFF00"
                  strokeWidth={2.5}
                  dot={{ fill: "#CCFF00", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-[#CCFF00]/30 bg-gradient-to-br from-[#CCFF00]/10 to-[#1a1a1a]"
          : "border-[#2a2a2a] bg-[#1a1a1a]"
      }`}
    >
      <div className="text-[11px] uppercase tracking-widest text-[#AAAAAA]">{label}</div>
      <div className={`mt-2 text-3xl font-black ${accent ? "text-[#CCFF00]" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <div className="mb-4 text-sm font-bold text-white">{title}</div>
      {children}
    </div>
  );
}