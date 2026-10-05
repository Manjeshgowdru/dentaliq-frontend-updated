import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "../api";
import { C, CHART_COLORS, Card, ErrorState, Grid, Insights, Loading, Page, PageHeader, Select, Stat, Table, eur, pct } from "../components/ui";

export default function Financial() {
  const [months, setMonths] = useState(6);
  const { data, error, loading, reload } = useApi(`/api/financial?months=${months}`);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const k = data.kpis;
  const change = k.pace_change || 0;

  return (
    <Page>
      <PageHeader
        title="Financial Intelligence"
        subtitle="Revenue, costs, profitability, collections and AI-forecast cash flow"
        actions={<Select value={months} onChange={(e) => setMonths(Number(e.target.value))} options={[{ value: 3, label: "Last 3 months" }, { value: 6, label: "Last 6 months" }, { value: 12, label: "Last 12 months" }]} style={{ width: 160 }} />}
      />

      <Grid cols="repeat(6, 1fr)" min={160}>
        <Stat label="Revenue (MTD)" value={eur(k.revenue_mtd)} sub={`Per working day ${change >= 0 ? "+" : ""}${change.toFixed(0)}% vs last month`} color={C.ind} />
        <Stat label="Profit (MTD)" value={eur(k.profit_mtd)} sub={`Margin ${pct(k.margin_mtd, 1)}`} color={C.grn} />
        <Stat label="Collection rate" value={pct(k.collection_rate, 1)} sub="Invoiced vs collected" color={C.tea} />
        <Stat label="Avg revenue / visit" value={eur(k.avg_revenue_per_visit)} color={C.vio} />
        <Stat label="Forecast next 30 days" value={eur(k.forecast_30d)} sub={`${eur(k.at_risk_30d)} at no-show risk`} color={C.amb} />
        <Stat label="Lost to no-shows" value={eur(k.noshow_lost_period)} sub={`Last ${months} months`} color={C.red} />
      </Grid>

      <Insights items={data.insights} />

      <Grid cols="2fr 1fr" min={320}>
        <Card title="Revenue, expenses & profit by month">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data.monthly}>
              <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.tx4 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => eur(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill={C.ind} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke={C.grn} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Revenue by category">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={data.by_category} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72}>
                {data.by_category.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => eur(v)} />
            </PieChart>
          </ResponsiveContainer>
          {data.by_category.map((c, i) => (
            <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.tx2 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />{c.name}</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{eur(c.value)}</span>
            </div>
          ))}
        </Card>
      </Grid>

      <Grid cols="1fr 1fr 1fr" min={300}>
        <Card title="Provider productivity">
          <Table rows={data.by_provider} columns={[
            { label: "Provider", key: "name" },
            { label: "Visits", key: "visits", align: "center" },
            { label: "Revenue", align: "right", render: (r) => eur(r.revenue) },
            { label: "€ / visit", align: "right", render: (r) => eur(r.per_visit) },
          ]} />
        </Card>
        <Card title="Expenses this month">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.expenses_breakdown} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.tx3 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v) => eur(v)} />
              <Bar dataKey="value" fill="#F87171" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Patient receivables (aging)">
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: C.amb, marginBottom: 10 }}>{eur(k.outstanding, 2)}</div>
          {data.aging.map((a, i) => (
            <div key={a.bucket} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: C.tx3 }}>{a.bucket}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600, color: [C.grn, C.amb, "#EA580C", C.red][i] }}>{eur(a.value, 2)}</span>
              </div>
              <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${k.outstanding ? (a.value / k.outstanding) * 100 : 0}%`, height: "100%", background: [C.grn, C.amb, "#EA580C", C.red][i] }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.tx4, marginTop: 8 }}>Patient share only — insurance portions are claimed from the insurer.</div>
        </Card>
      </Grid>

      <Card title="Monthly P&L">
        <Table rows={data.monthly} columns={[
          { label: "Month", key: "month" },
          { label: "Revenue", align: "right", render: (m) => eur(m.revenue) },
          { label: "of which insurance", align: "right", render: (m) => eur(m.insurance) },
          { label: "Collected", align: "right", render: (m) => eur(m.collected) },
          { label: "Expenses", align: "right", render: (m) => eur(m.expenses) },
          { label: "Profit", align: "right", render: (m) => <span style={{ color: m.profit >= 0 ? C.grn : C.red, fontWeight: 600 }}>{eur(m.profit)}</span> },
          { label: "Margin", align: "right", render: (m) => pct(m.margin, 1) },
        ]} />
      </Card>
    </Page>
  );
}
