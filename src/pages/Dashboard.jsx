import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import RiskBadge from "../components/RiskBadge";

const revenueData = [
  { date: "8 Jul", revenue: 6200, expenses: 3800, profit: 2400 },
  { date: "9 Jul", revenue: 7800, expenses: 4200, profit: 3600 },
  { date: "10 Jul", revenue: 5900, expenses: 3600, profit: 2300 },
  { date: "11 Jul", revenue: 8400, expenses: 4800, profit: 3600 },
  { date: "12 Jul", revenue: 7200, expenses: 4100, profit: 3100 },
  { date: "13 Jul", revenue: 9100, expenses: 5200, profit: 3900 },
  { date: "14 Jul", revenue: 6842, expenses: 3900, profit: 2942 },
];

const pieData = [
  { name: "General Dentistry", value: 52340, color: "#1D9E75" },
  { name: "Implants",          value: 35620, color: "#0891B2" },
  { name: "Orthodontics",      value: 28880, color: "#7C3AED" },
  { name: "Cosmetic Dentistry",value: 18750, color: "#DC2626" },
  { name: "Other Services",    value: 10660, color: "#64748B" },
];

const chairData = [
  { hour: "08:00", util: 45 }, { hour: "09:00", util: 65 },
  { hour: "10:00", util: 85 }, { hour: "11:00", util: 90 },
  { hour: "12:00", util: 60 }, { hour: "13:00", util: 78 },
  { hour: "14:00", util: 88 }, { hour: "15:00", util: 70 },
  { hour: "16:00", util: 40 },
];

const riskPatients = [
  { name: "Peter Kováč",    time: "10:30", proc: "Cleaning",        prob: 0.82, tag: "High" },
  { name: "Lucia Nováková", time: "14:00", proc: "Implant Consult", prob: 0.65, tag: "Medium" },
  { name: "Martin Horváth", time: "16:00", proc: "Filling",         prob: 0.58, tag: "Medium" },
  { name: "Jana Tothová",   time: "15:00", proc: "Crown Prep",      prob: 0.22, tag: "Low" },
];

const appointments = [
  { time: "09:00", name: "Eva Šimková",    proc: "Scaling & Polishing", status: "Completed", col: "#059669" },
  { time: "10:30", name: "Peter Kováč",    proc: "Cleaning",            status: "Upcoming",  col: "#0891B2" },
  { time: "11:30", name: "Anna Balážová",  proc: "Filling",             status: "Upcoming",  col: "#0891B2" },
  { time: "13:00", name: "Tomáš Mikuš",    proc: "Root Canal",          status: "Upcoming",  col: "#0891B2" },
  { time: "14:00", name: "Lucia Nováková", proc: "Implant Consult",     status: "Upcoming",  col: "#0891B2" },
];

const stockAlerts = [
  { item: "Composite Resin A2", current: 4,  min: 10, status: "Low" },
  { item: "Alginate Powder",    current: 2,  min: 5,  status: "Low" },
  { item: "Local Anesthetic",   current: 6,  min: 10, status: "Low" },
  { item: "Gloves (M)",         current: 18, min: 50, status: "Medium" },
  { item: "Suction Tips",       current: 15, min: 30, status: "Medium" },
];

const equipment = [
  { name: "Dental Chair 1", status: "In Use",      patient: "Patient: Anna B.", col: "#0891B2" },
  { name: "Dental Chair 2", status: "In Use",      patient: "Patient: Tomáš M.", col: "#0891B2" },
  { name: "Dental Chair 3", status: "Idle",        patient: "Available",        col: "#059669" },
  { name: "X-Ray Machine",  status: "In Use",      patient: "Patient: Eva S.",  col: "#0891B2" },
  { name: "CT Scanner",     status: "Maintenance", patient: "Until 15 Jul",    col: "#B45309" },
];

const topProcs = [
  { proc: "Dental Implants", count: 28, revenue: 28560 },
  { proc: "Crowns",          count: 24, revenue: 24850 },
  { proc: "Root Canal",      count: 26, revenue: 19240 },
  { proc: "Teeth Whitening", count: 42, revenue: 14880 },
  { proc: "Fillings",        count: 66, revenue: 10750 },
];

const invoices = [
  { id: "INV-2026-1456", patient: "Peter Kováč",    date: "14 Jul", amount: 320,  status: "Paid",   col: "#059669" },
  { id: "INV-2026-1455", patient: "Lucia Nováková", date: "14 Jul", amount: 1250, status: "Paid",   col: "#059669" },
  { id: "INV-2026-1454", patient: "Martin Horváth", date: "14 Jul", amount: 450,  status: "Unpaid", col: "#DC2626" },
  { id: "INV-2026-1453", patient: "Jana Tothová",   date: "13 Jul", amount: 780,  status: "Paid",   col: "#059669" },
  { id: "INV-2026-1452", patient: "Eva Šimková",    date: "13 Jul", amount: 150,  status: "Paid",   col: "#059669" },
];

const S = {
  card: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16 },
  cardTitle: { fontSize: 12, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 },
  th: { padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".8px", borderBottom: "1px solid #E2E8F0" },
  td: { padding: "11px 12px", fontSize: 13, color: "#374151", borderBottom: "1px solid #F1F5F9" },
};

export default function Dashboard() {
  return (
    <div style={{ padding: 20, background: "#F0F4FF", minHeight: "100vh" }}>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Today's Revenue",     val: "€6,842",  sub: "↑ 18.6% vs yesterday", col: "#4F5BD5", icon: "💶" },
          { label: "Appointments Today",  val: "36",       sub: "Completed: 18 · Upcoming: 18", col: "#0891B2", icon: "📅" },
          { label: "No-Show Risk (AI)",   val: "7 (19.4%)",sub: "High Risk: 4",         col: "#DC2626", icon: "🚨" },
          { label: "Treatment Acceptance",val: "68.7%",    sub: "↑ 8.3% vs last 7 days",col: "#059669", icon: "✅" },
          { label: "Chair Utilization",   val: "76.3%",    sub: "↑ 6.2% vs last 7 days",col: "#7C3AED", icon: "🪑" },
          { label: "Net Profit (MTD)",    val: "€48,250",  sub: "↑ 22.1% vs last month",col: "#B45309", icon: "📈" },
        ].map((k, i) => (
          <div key={i} style={{ ...S.card, borderTop: `3px solid ${k.col}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{k.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: k.col, background: `${k.col}15`, padding: "2px 6px", borderRadius: 4 }}>MTD</span>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: k.col }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, textTransform: "uppercase", letterSpacing: ".6px" }}>{k.label}</div>
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2 — Revenue chart + Pie + AI Risk */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Revenue Chart */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={S.cardTitle}>Revenue Overview</div>
            <select style={{ fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 8px", color: "#64748B" }}>
              <option>Last 7 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `€${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue"  stroke="#4F5BD5" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#DC2626" strokeWidth={2} dot={false} name="Expenses" />
              <Line type="monotone" dataKey="profit"   stroke="#059669" strokeWidth={2} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {[["#4F5BD5","Revenue"],["#DC2626","Expenses"],["#059669","Profit"]].map(([col,label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
                <span style={{ fontSize: 11, color: "#64748B" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart */}
        <div style={S.card}>
          <div style={S.cardTitle}>Revenue by Category (MTD)</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={v => `€${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#0F172A", textAlign: "center", marginBottom: 10 }}>€146,250 Total Revenue</div>
          {pieData.map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                <span style={{ fontSize: 11, color: "#475569" }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#0F172A", fontWeight: 600 }}>€{(d.value/1000).toFixed(0)}k</span>
            </div>
          ))}
        </div>

        {/* AI Risk Alerts */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={S.cardTitle}>AI Risk Alerts</div>
            <span style={{ fontSize: 11, color: "#4F5BD5", cursor: "pointer" }}>View All</span>
          </div>
          {riskPatients.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < riskPatients.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#4F5BD514", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#4F5BD5", flexShrink: 0 }}>
                {p.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>{p.time} · {p.proc}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: p.prob >= 0.55 ? "#DC2626" : p.prob >= 0.38 ? "#B45309" : "#059669", background: p.prob >= 0.55 ? "#FEF2F2" : p.prob >= 0.38 ? "#FFFBEB" : "#ECFDF5", padding: "2px 8px", borderRadius: 4 }}>
                  {p.tag}
                </span>
                <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{Math.round(p.prob * 100)}%</div>
                <div style={{ fontSize: 9, color: "#94A3B8" }}>No-show Risk</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3 — Appointments + Chair util + Treatment */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Appointments */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={S.cardTitle}>Today's Appointments</div>
            <span style={{ fontSize: 11, color: "#4F5BD5", cursor: "pointer" }}>View Calendar</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {appointments.map((a, i) => (
                <tr key={i}>
                  <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12, color: "#64748B", width: 50 }}>{a.time}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: "#0F172A" }}>{a.name}</td>
                  <td style={{ ...S.td, color: "#64748B" }}>{a.proc}</td>
                  <td style={{ ...S.td }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: a.col, background: `${a.col}15`, padding: "2px 8px", borderRadius: 4 }}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, fontSize: 12, color: "#64748B" }}>
            Total Appointments Today: <strong style={{ color: "#0F172A" }}>36</strong> · Completed: <strong style={{ color: "#059669" }}>18</strong> · Upcoming: <strong style={{ color: "#0891B2" }}>18</strong>
          </div>
        </div>

        {/* Chair Utilization */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={S.cardTitle}>Chair Utilization (Today)</div>
            <span style={{ fontSize: 11, color: "#64748B" }}>By Hour ▾</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chairData} barSize={18}>
              <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="util" name="Utilization" fill="#4F5BD5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Treatment Acceptance */}
        <div style={S.card}>
          <div style={S.cardTitle}>Treatment Acceptance (Last 30 Days)</div>
          <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <svg width="120" height="120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#F1F5F9" strokeWidth="10" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="#059669" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${0.687 * 302} 302`} transform="rotate(-90 60 60)" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#059669" }}>68.7%</div>
                <div style={{ fontSize: 9, color: "#94A3B8" }}>Acceptance Rate</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#059669", textAlign: "center", marginBottom: 12 }}>↑ 8.3% vs last 30 days</div>
          {[["Accepted","€98,250","#059669",75],["Pending","€32,450","#B45309",30],["Declined","€15,550","#DC2626",15]].map(([label,val,col,pct]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#64748B" }}>{label}</span>
              <div style={{ flex: 1, height: 4, background: "#F1F5F9", borderRadius: 2, margin: "0 10px", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: col }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4 — Stock + Equipment + Top Procedures + Invoices */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Stock Alerts */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.cardTitle}>Low Stock Alerts</div>
            <span style={{ fontSize: 11, color: "#4F5BD5", cursor: "pointer" }}>View All</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>Item</th>
                <th style={{ ...S.th, textAlign: "center" }}>Qty</th>
                <th style={{ ...S.th, textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stockAlerts.map((s, i) => (
                <tr key={i}>
                  <td style={{ ...S.td, fontSize: 11 }}>{s.item}</td>
                  <td style={{ ...S.td, textAlign: "center", fontFamily: "monospace" }}>{s.current}/{s.min}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: s.status === "Low" ? "#DC2626" : "#B45309", background: s.status === "Low" ? "#FEF2F2" : "#FFFBEB", padding: "2px 6px", borderRadius: 4 }}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Equipment */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.cardTitle}>Equipment Status</div>
            <span style={{ fontSize: 11, color: "#4F5BD5", cursor: "pointer" }}>View All</span>
          </div>
          {equipment.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < equipment.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.col, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{e.name}</div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>{e.patient}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: e.col }}>{e.status}</span>
            </div>
          ))}
        </div>

        {/* Top Procedures */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.cardTitle}>Top Procedures (MTD)</div>
            <span style={{ fontSize: 11, color: "#4F5BD5", cursor: "pointer" }}>View All</span>
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
              {topProcs.map((p, i) => (
                <tr key={i}>
                  <td style={{ ...S.td, fontSize: 11 }}>{p.proc}</td>
                  <td style={{ ...S.td, textAlign: "center", fontFamily: "monospace" }}>{p.count}</td>
                  <td style={{ ...S.td, textAlign: "right", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>€{p.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Invoices */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.cardTitle}>Recent Invoices</div>
            <span style={{ fontSize: 11, color: "#4F5BD5", cursor: "pointer" }}>View All</span>
          </div>
          {invoices.map((inv, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < invoices.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{inv.patient}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>{inv.id} · {inv.date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#0F172A" }}>€{inv.amount}</div>
                <span style={{ fontSize: 10, fontWeight: 600, color: inv.col, background: `${inv.col}15`, padding: "1px 6px", borderRadius: 4 }}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5 — AI Recommendation + Cash Flow + Revenue at Risk + Business Health */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 14 }}>

        {/* AI Recommendation */}
        <div style={{ ...S.card, background: "linear-gradient(135deg,#4F5BD5,#7C3AED)", border: "none" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>🤖 AI Recommendation</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8, lineHeight: 1.5 }}>Increase implant consultation slots on Fridays.</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginBottom: 16 }}>Prediction: 23% more implant cases can be booked.</div>
          <button style={{ background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 6, padding: "8px 16px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Apply</button>
        </div>

        {/* Cash Flow */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={S.cardTitle}>Cash Flow Forecast</div>
            <span style={{ fontSize: 10, color: "#64748B" }}>Next 7 Days</span>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: "#059669" }}>€18,420</div>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>Expected Net Cash Inflow</div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={revenueData}>
              <Area type="monotone" dataKey="profit" stroke="#059669" fill="#05966920" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue at Risk */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={S.cardTitle}>Revenue at Risk</div>
            <span style={{ fontSize: 10, color: "#64748B" }}>Next 7 Days</span>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: "#DC2626" }}>€7,850</div>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>Due to high no-show & cancel risk</div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={revenueData}>
              <Area type="monotone" dataKey="expenses" stroke="#DC2626" fill="#DC262620" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Business Health */}
        <div style={S.card}>
          <div style={S.cardTitle}>Business Health Score</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
            <div style={{ fontFamily: "monospace", fontSize: 36, fontWeight: 700, color: "#059669" }}>86</div>
            <div style={{ fontSize: 14, color: "#94A3B8" }}>/100</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#059669", marginBottom: 12 }}>Excellent</div>
          {[["Revenue Growth","92%","#059669"],["Patient Retention","88%","#059669"],["Chair Efficiency","76%","#0891B2"],["No-Show Control","78%","#0891B2"]].map(([label,val,col]) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "#64748B" }}>{label}</span>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: col, fontWeight: 600 }}>{val}</span>
              </div>
              <div style={{ height: 3, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: val, height: "100%", background: col, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}