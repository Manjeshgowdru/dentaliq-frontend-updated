import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import RiskBadge from "../components/RiskBadge";
import { useApi } from "../api";
import { Badge, CHART_COLORS, ErrorState, Loading, eur } from "../components/ui";

const S = {
  card: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, minWidth: 0 },
  cardTitle: { fontSize: 12, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 },
  th: { padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".8px", borderBottom: "1px solid #E2E8F0" },
  td: { padding: "11px 12px", fontSize: 13, color: "#374151", borderBottom: "1px solid #F1F5F9" },
  link: { fontSize: 11, color: "#4F5BD5", cursor: "pointer" },
};

const STATUS_COL = { Completed: "#059669", Upcoming: "#0891B2", "No-show": "#DC2626", Cancelled: "#64748B" };

export default function Dashboard({ onNavigate = () => {} }) {
  const { data, error, loading, reload } = useApi("/api/dashboard");
  if (loading && !data) return <Loading text="Loading today's clinic overview…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const k = data.kpis;
  const totalCat = data.by_category.reduce((s, c) => s + c.value, 0);
  const healthLabel = data.health.score >= 80 ? "Excellent" : data.health.score >= 65 ? "Good" : data.health.score >= 50 ? "Fair" : "Needs attention";
  const healthCol = data.health.score >= 65 ? "#059669" : data.health.score >= 50 ? "#B45309" : "#DC2626";

  return (
    <div style={{ padding: 20, background: "#F0F4FF" }}>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Today's Revenue", val: eur(k.today_revenue), sub: k.today_revenue_change == null ? "Booked + invoiced today" : `${k.today_revenue_change >= 0 ? "↑" : "↓"} ${Math.abs(k.today_revenue_change)}% vs last working day`, col: "#4F5BD5", icon: "💶", tag: "TODAY", go: "financial" },
          { label: "Appointments Today", val: k.appointments_today, sub: `Completed: ${k.completed_today} · Upcoming: ${k.upcoming_today}`, col: "#0891B2", icon: "📅", tag: "TODAY", go: "appointments" },
          { label: "No-Show Risk (AI)", val: `${k.high_risk_today} high`, sub: `Expected no-shows today: ${k.expected_noshows_today}`, col: "#DC2626", icon: "🚨", tag: "AI", go: "predictions" },
          { label: "Treatment Acceptance", val: `${k.treatment_acceptance}%`, sub: "Plans accepted ÷ decided", col: "#059669", icon: "✅", tag: "ALL", go: "treatment" },
          { label: "Chair Utilization", val: `${k.chair_utilization}%`, sub: "Booked chair time today", col: "#7C3AED", icon: "🪑", tag: "TODAY", go: "equipment" },
          { label: "Net Profit (MTD)", val: eur(k.net_profit_mtd), sub: `Revenue MTD ${eur(k.revenue_mtd)}`, col: "#B45309", icon: "📈", tag: "MTD", go: "financial" },
        ].map((x, i) => (
          <div key={i} onClick={() => onNavigate(x.go)} style={{ ...S.card, borderTop: `3px solid ${x.col}`, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{x.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: x.col, background: `${x.col}15`, padding: "2px 6px", borderRadius: 4 }}>{x.tag}</span>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: x.col }}>{x.val}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, textTransform: "uppercase", letterSpacing: ".6px" }}>{x.label}</div>
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>{x.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2 — Revenue chart + Pie + AI Risk */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={S.cardTitle}>Revenue Overview · last 7 working days</div>
            <span style={S.link} onClick={() => onNavigate("financial")}>Financials →</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.revenue_7d}>
              <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={v => eur(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#4F5BD5" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#DC2626" strokeWidth={2} dot={false} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {[["#4F5BD5", "Revenue"], ["#DC2626", "Expenses"], ["#059669", "Profit"]].map(([col, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
                <span style={{ fontSize: 11, color: "#64748B" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Revenue by Category (MTD)</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data.by_category} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name">
                {data.by_category.map((d, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => eur(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#0F172A", textAlign: "center", marginBottom: 10 }}>{eur(totalCat)} completed treatments</div>
          {data.by_category.slice(0, 6).map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span style={{ fontSize: 11, color: "#475569" }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#0F172A", fontWeight: 600 }}>{eur(d.value)}</span>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={S.cardTitle}>AI Risk Alerts · 7 days</div>
            <span style={S.link} onClick={() => onNavigate("predictions")}>View All</span>
          </div>
          {data.risk_patients.length === 0 && <div style={{ fontSize: 12, color: "#94A3B8" }}>No upcoming appointments.</div>}
          {data.risk_patients.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < data.risk_patients.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#4F5BD514", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#4F5BD5", flexShrink: 0 }}>
                {p.patient.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.patient}</div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>{p.date.slice(5)} {p.time} · {p.treatment_name}</div>
              </div>
              <RiskBadge prob={p.prob} />
            </div>
          ))}
        </div>
      </div>

      {/* Row 3 — Appointments + Chair util + Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={S.cardTitle}>Today's Appointments</div>
            <span style={S.link} onClick={() => onNavigate("equipment")}>Chair schedule →</span>
          </div>
          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {data.todays_appointments.length === 0 && <tr><td style={S.td}>The clinic is closed today.</td></tr>}
                {data.todays_appointments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12, color: "#64748B", width: 50 }}>{a.time}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: "#0F172A" }}>{a.patient}</td>
                    <td style={{ ...S.td, color: "#64748B" }}>{a.treatment_name}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COL[a.status], background: `${STATUS_COL[a.status]}15`, padding: "2px 8px", borderRadius: 4 }}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, fontSize: 12, color: "#64748B" }}>
            Total today: <strong style={{ color: "#0F172A" }}>{k.appointments_today}</strong> · Completed: <strong style={{ color: "#059669" }}>{k.completed_today}</strong> · Upcoming: <strong style={{ color: "#0891B2" }}>{k.upcoming_today}</strong>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Chair Utilization (Today)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.chair_by_hour} barSize={16}>
              <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="util" name="Utilization" fill="#4F5BD5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...S.card, background: "linear-gradient(135deg,#4F5BD5,#7C3AED)", border: "none" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>🤖 AI Recommendations</div>
          {data.insights.length === 0 && <div style={{ fontSize: 13, color: "#fff" }}>Everything is on track today.</div>}
          {data.insights.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: "#fff", lineHeight: 1.5, marginBottom: 10 }}>• {t}</div>
          ))}
        </div>
      </div>

      {/* Row 4 — Stock + Equipment + Top Procedures + Invoices */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.cardTitle}>Low Stock Alerts</div>
            <span style={S.link} onClick={() => onNavigate("stock")}>View All</span>
          </div>
          {data.low_stock.length === 0 && <div style={{ fontSize: 12, color: "#059669" }}>All items above minimum ✓</div>}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {data.low_stock.map((s) => (
                <tr key={s.id}>
                  <td style={{ ...S.td, fontSize: 11 }}>{s.name}</td>
                  <td style={{ ...S.td, textAlign: "center", fontFamily: "monospace" }}>{s.qty}/{s.min_qty}</td>
                  <td style={{ ...S.td, textAlign: "center" }}><Badge>{s.qty === 0 ? "Out of stock" : "Low"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.cardTitle}>Equipment Status</div>
            <span style={S.link} onClick={() => onNavigate("equipment")}>View All</span>
          </div>
          {data.equipment.map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < data.equipment.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.status === "Operational" ? "#059669" : "#B45309", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{e.name}</div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>Next service {e.next_service}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: e.status === "Operational" ? "#059669" : "#B45309" }}>{e.status}</span>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.cardTitle}>Top Procedures (MTD)</div>
            <span style={S.link} onClick={() => onNavigate("reports")}>Reports</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>Procedure</th>
                <th style={{ ...S.th, textAlign: "center" }}>Count</th>
                <th style={{ ...S.th, textAlign: "right" }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.top_procedures.map((p, i) => (
                <tr key={i}>
                  <td style={{ ...S.td, fontSize: 11 }}>{p.proc}</td>
                  <td style={{ ...S.td, textAlign: "center", fontFamily: "monospace" }}>{p.count}</td>
                  <td style={{ ...S.td, textAlign: "right", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>{eur(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.cardTitle}>Recent Invoices</div>
            <span style={S.link} onClick={() => onNavigate("billing")}>View All</span>
          </div>
          {data.recent_invoices.map((inv, i) => (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < data.recent_invoices.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{inv.patient}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>{inv.id} · {inv.date.slice(5)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#0F172A" }}>{eur(inv.amount)}</div>
                <Badge>{inv.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5 — Cash Flow + Revenue at Risk + Business Health */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={S.cardTitle}>Cash Flow Forecast</div>
            <span style={{ fontSize: 10, color: "#64748B" }}>Next 7 Days</span>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: "#059669" }}>{eur(data.cash_forecast_7d.total)}</div>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>Expected revenue after AI no-show adjustment</div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={data.cash_forecast_7d.series}>
              <Tooltip formatter={v => eur(v)} labelFormatter={(_, p) => p?.[0]?.payload?.day} />
              <Area type="monotone" dataKey="value" stroke="#059669" fill="#05966920" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={S.cardTitle}>Revenue at Risk</div>
            <span style={{ fontSize: 10, color: "#64748B" }}>Next 7 Days</span>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: "#DC2626" }}>{eur(data.revenue_at_risk_7d.total)}</div>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>Fees × predicted no-show probability</div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={data.revenue_at_risk_7d.series}>
              <Tooltip formatter={v => eur(v)} labelFormatter={(_, p) => p?.[0]?.payload?.day} />
              <Area type="monotone" dataKey="value" stroke="#DC2626" fill="#DC262620" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Business Health Score</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
            <div style={{ fontFamily: "monospace", fontSize: 36, fontWeight: 700, color: healthCol }}>{data.health.score}</div>
            <div style={{ fontSize: 14, color: "#94A3B8" }}>/100</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: healthCol, marginBottom: 12 }}>{healthLabel}</div>
          {Object.entries(data.health.parts).map(([label, val]) => {
            const col = val >= 70 ? "#059669" : val >= 50 ? "#0891B2" : "#B45309";
            return (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: "#64748B" }}>{label}</span>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: col, fontWeight: 600 }}>{val}%</span>
                </div>
                <div style={{ height: 3, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${val}%`, height: "100%", background: col, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
