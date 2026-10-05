import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, useApi } from "../api";
import RiskBadge from "../components/RiskBadge";
import { useSettings } from "../SettingsContext";
import { Badge, Button, C, Card, ErrorState, Grid, Loading, Notice, Page, PageHeader, Select, Stat, Table, Tabs, eur, fmtDate } from "../components/ui";

const LEVEL_COLORS = { critical: C.red, high: "#EA580C", moderate: C.amb, low: C.grn };

export default function Predictions() {
  const [days, setDays] = useState(7);
  const { data, error, loading, reload } = useApi(`/api/predictions?days=${days}`);
  const [level, setLevel] = useState("all");
  const [open, setOpen] = useState(null);
  const { settings } = useSettings();

  if (loading && !data) return <Loading text="Scoring upcoming appointments…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const s = data.summary;
  const rows = level === "all" ? data.appointments : data.appointments.filter((a) => a.risk_level === level);
  const meta = data.model.meta;

  const remind = async (a) => {
    const clinic = settings?.clinic?.name || "our clinic";
    const tpl = settings?.reminders?.template_sk || "Dobrý deň {name}, pripomíname Vám termín v {clinic} dňa {date} o {time}.";
    const text = tpl.replace("{name}", a.patient).replace("{clinic}", clinic).replace("{date}", fmtDate(a.date)).replace("{time}", a.time);
    const digits = (a.phone || "").replace(/[^0-9]/g, "");
    try {
      await api(`/api/appointments/${a.id}/reminder`, { method: "POST" });
    } catch (e) {
      console.warn(e);
    }
    if (a.risk_level === "moderate") {
      window.location.href = `sms:${a.phone}?body=${encodeURIComponent(text)}`;
    } else {
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank");
    }
    reload();
  };

  return (
    <Page>
      <PageHeader
        title="AI No-Show Predictions"
        subtitle={meta ? `Model v${meta.version} · ${meta.algorithm} · validated AUC ${meta.metrics.roc_auc}` : "Heuristic scoring (model not loaded)"}
        actions={<Select value={days} onChange={(e) => setDays(Number(e.target.value))} options={[{ value: 1, label: "Today + tomorrow" }, { value: 7, label: "Next 7 days" }, { value: 14, label: "Next 14 days" }, { value: 21, label: "Next 21 days" }]} style={{ width: 170 }} />}
      />

      {!data.model.loaded && <Notice tone="warning">The ML model could not be loaded ({data.model.error}). Showing heuristic scores.</Notice>}

      <Grid cols="repeat(5, 1fr)" min={170}>
        <Stat label="Upcoming appointments" value={s.total} color={C.ind} />
        <Stat label="Expected no-shows" value={s.expected_noshows} sub={`${s.total ? Math.round((s.expected_noshows / s.total) * 100) : 0}% of bookings`} color={C.red} />
        <Stat label="Revenue at risk" value={eur(s.revenue_at_risk)} sub={`of ${eur(s.scheduled_revenue)} scheduled`} color={C.amb} />
        <Stat label="Critical + high" value={s.levels.critical + s.levels.high} sub="Need personal follow-up" color="#EA580C" />
        <Stat label="Low risk" value={s.levels.low} sub="Monitor only" color={C.grn} />
      </Grid>

      <Grid cols="2fr 1fr" min={320}>
        <Card title="Expected no-shows by day">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.by_day.map((d) => ({ ...d, label: fmtDate(d.date).replace(/ \d{4}$/, "") }))}>
              <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v, n) => (n === "at_risk" ? eur(v) : Number(v).toFixed(1))} />
              <Bar dataKey="appointments" name="Appointments" fill="#C7CCF5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expected_noshows" name="Expected no-shows" fill={C.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Clinic history: no-show rate by booking lead time">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.history_by_lead}>
              <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" name="No-show rate" fill={C.ind} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      <Card pad={0}>
        <div style={{ padding: "12px 16px" }}>
          <Tabs active={level} onChange={setLevel} tabs={[
            { key: "all", label: "All", count: data.appointments.length },
            { key: "critical", label: "Critical", count: s.levels.critical },
            { key: "high", label: "High", count: s.levels.high },
            { key: "moderate", label: "Moderate", count: s.levels.moderate },
            { key: "low", label: "Low", count: s.levels.low },
          ]} />
        </div>
        <Table
          rows={rows}
          empty="No appointments in this risk group."
          columns={[
            { label: "When", render: (a) => (<div><div style={{ fontWeight: 600, color: C.tx1 }}>{fmtDate(a.date)}</div><div style={{ fontSize: 11, color: C.tx4 }}>{a.time} · {a.duration} min</div></div>) },
            { label: "Patient", render: (a) => (<div><div style={{ fontWeight: 600, color: C.tx1 }}>{a.patient}</div><div style={{ fontSize: 11, color: C.tx4 }}>{a.phone}</div></div>) },
            { label: "Treatment", key: "treatment_name" },
            { label: "Fee", align: "right", render: (a) => eur(a.fee) },
            { label: "AI risk", render: (a) => <RiskBadge prob={a.prob} /> },
            {
              label: "Why", wrap: true, render: (a) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 320 }}>
                  {a.factors.slice(0, open === a.id ? 4 : 2).map((f, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: f.effect === "up" ? "#FEF2F2" : "#ECFDF5", color: f.effect === "up" ? C.red : C.grn }}>
                      {f.effect === "up" ? "▲" : "▼"} {f.text}
                    </span>
                  ))}
                  {a.factors.length > 2 && (
                    <button onClick={() => setOpen(open === a.id ? null : a.id)} style={{ fontSize: 11, border: "none", background: "transparent", color: C.ind, cursor: "pointer" }}>
                      {open === a.id ? "less" : `+${a.factors.length - 2}`}
                    </button>
                  )}
                </div>
              ),
            },
            { label: "Recommended action", render: (a) => <span style={{ fontSize: 12, color: LEVEL_COLORS[a.risk_level], fontWeight: 600 }}>{a.action}</span> },
            {
              label: "", render: (a) => a.risk_level === "low"
                ? <Badge tone="green">No action</Badge>
                : a.reminded_at
                  ? <Badge tone="teal">Reminded</Badge>
                  : <Button small variant={a.risk_level === "moderate" ? "secondary" : "success"} onClick={() => remind(a)}>{a.risk_level === "moderate" ? "💬 SMS" : "📲 WhatsApp"}</Button>,
            },
          ]}
        />
      </Card>

      {meta && (
        <Card title="About the model">
          <Grid cols="repeat(4, 1fr)" min={180} gap={10}>
            <MiniFact label="Validated AUC (all bookings)" value={meta.metrics.roc_auc} />
            <MiniFact label="AUC (advance bookings only)" value={meta.metrics.roc_auc_advance_bookings} />
            <MiniFact label="Predicted vs actual no-show rate" value={`${(meta.metrics.mean_predicted * 100).toFixed(1)}% vs ${(meta.metrics.actual_noshow_rate * 100).toFixed(1)}%`} />
            <MiniFact label="Training rows" value={meta.training_rows.toLocaleString()} />
          </Grid>
          <div style={{ fontSize: 12, color: C.tx3, marginTop: 12, lineHeight: 1.6 }}>
            Trained on {meta.dataset}; validated on a time-based split ({meta.metrics.validation}). Risk levels use the thresholds in Settings →
            AI &amp; risk rules. The explanation chips come from the model's own per-feature contributions (SHAP values). Next step: retrain on the clinic's own appointment history.
          </div>
        </Card>
      )}
    </Page>
  );
}

function MiniFact({ label, value }) {
  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.tx1, fontFamily: "monospace" }}>{value}</div>
      <div style={{ fontSize: 11, color: C.tx3, marginTop: 2 }}>{label}</div>
    </div>
  );
}
