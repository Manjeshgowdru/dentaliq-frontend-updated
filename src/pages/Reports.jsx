import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "../api";
import { Button, C, Card, ErrorState, Grid, Loading, Page, PageHeader, Select, Stat, Table, downloadCsv, eur } from "../components/ui";

export default function Reports() {
  const [months, setMonths] = useState(6);
  const { data, error, loading, reload } = useApi(`/api/reports?months=${months}`);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const k = data.kpis;

  return (
    <Page>
      <PageHeader
        title="Reports"
        subtitle="Attendance, no-shows, patient growth, satisfaction and provider performance"
        actions={<>
          <Select value={months} onChange={(e) => setMonths(Number(e.target.value))} options={[{ value: 3, label: "Last 3 months" }, { value: 6, label: "Last 6 months" }, { value: 12, label: "Last 12 months" }]} style={{ width: 160 }} />
          <Button variant="secondary" onClick={() => downloadCsv(`monthly-report-${months}m.csv`, data.monthly, [
            { label: "Month", key: "month" }, { label: "Appointments", key: "appointments" }, { label: "Completed", key: "completed" }, { label: "No-shows", key: "noshows" },
            { label: "Cancelled", key: "cancelled" }, { label: "No-show rate %", key: "noshow_rate" }, { label: "New patients", key: "new_patients" }, { label: "Avg rating", key: "avg_rating" },
          ])}>⬇ Export CSV</Button>
          <Button variant="secondary" onClick={() => window.print()}>🖨 Print</Button>
        </>}
      />

      <Grid cols="repeat(6, 1fr)" min={160}>
        <Stat label="Appointments" value={k.appointments.toLocaleString()} color={C.ind} />
        <Stat label="Completed" value={k.completed.toLocaleString()} color={C.grn} />
        <Stat label="No-show rate" value={`${k.noshow_rate}%`} color={C.red} />
        <Stat label="Cancellation rate" value={`${k.cancel_rate}%`} color={C.amb} />
        <Stat label="New patients" value={k.new_patients} color={C.tea} />
        <Stat label="Patient satisfaction" value={k.avg_rating ? `${k.avg_rating} ★` : "—"} sub={k.nps != null ? `NPS ${k.nps} · ${k.ratings} ratings` : ""} color={C.vio} />
      </Grid>

      <Grid cols="2fr 1fr" min={320}>
        <Card title="Monthly attendance">
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data.monthly}>
              <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.tx4 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="completed" name="Completed" stackId="a" fill={C.ind} />
              <Bar yAxisId="l" dataKey="noshows" name="No-shows" stackId="a" fill="#F87171" />
              <Bar yAxisId="l" dataKey="cancelled" name="Cancelled" stackId="a" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              <Line yAxisId="r" type="monotone" dataKey="noshow_rate" name="No-show rate %" stroke={C.red} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card title="New patients per month">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.monthly}>
              <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="new_patients" name="New patients" fill={C.tea} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      <Grid cols="1fr 1fr 1fr" min={280}>
        <RateCard title="No-show rate by weekday" data={data.by_weekday} x="day" />
        <RateCard title="No-show rate by booking lead time" data={data.by_lead} x="bucket" />
        <RateCard title="Effect of SMS reminders (bookings ≥ 2 days ahead)" data={data.reminders} x="group" color={C.grn} />
      </Grid>

      <Grid cols="1fr 1fr" min={320}>
        <Card title="Provider performance">
          <Table rows={data.providers} columns={[
            { label: "Provider", render: (p) => (<div><div style={{ fontWeight: 600, color: C.tx1 }}>{p.name}</div><div style={{ fontSize: 11, color: C.tx4 }}>{p.role}</div></div>) },
            { label: "Visits", key: "visits", align: "center" },
            { label: "Revenue", align: "right", render: (p) => eur(p.revenue) },
            { label: "No-show", align: "right", render: (p) => `${p.noshow_rate}%` },
            { label: "Rating", align: "right", render: (p) => (p.avg_rating ? `${p.avg_rating} ★` : "—") },
          ]} />
        </Card>
        <Card title="Procedure mix (completed)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.procedure_mix} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.tx3 }} axisLine={false} tickLine={false} width={150} />
              <Tooltip />
              <Bar dataKey="count" name="Visits" fill={C.vio} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      <Card title="Monthly summary">
        <Table rows={data.monthly} columns={[
          { label: "Month", key: "month" }, { label: "Appointments", key: "appointments", align: "right" }, { label: "Completed", key: "completed", align: "right" },
          { label: "No-shows", key: "noshows", align: "right" }, { label: "Cancelled", key: "cancelled", align: "right" },
          { label: "No-show rate", align: "right", render: (m) => `${m.noshow_rate}%` }, { label: "New patients", key: "new_patients", align: "right" },
          { label: "Avg rating", align: "right", render: (m) => (m.avg_rating ? `${m.avg_rating} ★` : "—") },
        ]} />
      </Card>
    </Page>
  );
}

function RateCard({ title, data, x, color = C.red }) {
  return (
    <Card title={title}>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="2 6" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey={x} tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.tx4 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="rate" name="No-show rate" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
