import { useMemo, useState } from "react";
import { api, urlParam, useApi } from "../api";
import RiskBadge from "../components/RiskBadge";
import { normalizePhone, PHONE_HELP } from "../phone";
import {
  Badge, Button, C, Card, ErrorState, Field, Grid, Input, Loading, Modal, Notice, Page, PageHeader, SearchBox, Select, Stat, Table, Tabs,
  Toggle, downloadCsv, eur, fmtDate,
} from "../components/ui";

const PAGE_SIZE = 50;

export default function Patients() {
  const { data, error, loading, reload } = useApi("/api/patients");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => urlParam("open"));
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    if (!data) return [];
    const ql = q.trim().toLowerCase();
    return data.patients.filter((p) => {
      if (ql && !(p.name.toLowerCase().includes(ql) || p.phone.includes(ql) || p.id.toLowerCase().includes(ql) || (p.email || "").toLowerCase().includes(ql))) return false;
      if (filter === "upcoming") return !!p.next_appointment;
      if (filter === "risk") return p.risk_level === "high" || p.risk_level === "critical";
      if (filter === "balance") return p.balance > 0;
      if (filter === "new") return (Date.now() - new Date(p.registered)) / 86400000 <= 90;
      return true;
    });
  }, [data, q, filter]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const s = data.summary;
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  return (
    <Page>
      <PageHeader
        title="Patients"
        subtitle="Patient records, visit history, balances and no-show risk"
        actions={<>
          <Button variant="secondary" onClick={() => downloadCsv("patients.csv", rows, [
            { label: "ID", key: "id" }, { label: "Name", key: "name" }, { label: "Phone", key: "phone" }, { label: "Email", key: "email" },
            { label: "Insurer", key: "insurer" }, { label: "Visits", key: "visits" }, { label: "No-shows", key: "noshows" },
            { label: "Last visit", key: "last_visit" }, { label: "Balance", key: "balance" },
          ])}>⬇ Export CSV</Button>
          <Button onClick={() => setAdding(true)}>+ New Patient</Button>
        </>}
      />

      <Grid cols="repeat(5, 1fr)" min={170}>
        <Stat label="Total patients" value={s.total.toLocaleString()} color={C.ind} />
        <Stat label="New (last 90 days)" value={s.new_90d} color={C.grn} />
        <Stat label="With upcoming visit" value={s.with_upcoming} color={C.tea} />
        <Stat label="High no-show risk" value={s.high_risk} color={C.red} />
        <Stat label="Outstanding balance" value={eur(s.outstanding_balance)} color={C.amb} />
      </Grid>

      <Card pad={0}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Tabs
            active={filter}
            onChange={(f) => { setFilter(f); setPage(0); }}
            tabs={[{ key: "all", label: "All" }, { key: "upcoming", label: "Upcoming visit" }, { key: "risk", label: "High risk" }, { key: "balance", label: "Owes money" }, { key: "new", label: "New" }]}
          />
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Name, phone, ID, email" />
        </div>
        <Table
          rows={pageRows}
          onRowClick={(p) => setSelected(p.id)}
          columns={[
            { label: "Patient", render: (p) => (<div><div style={{ fontWeight: 600, color: C.tx1 }}>{p.name}</div><div style={{ fontSize: 11, color: C.tx4 }}>{p.id} · {p.age} y · {p.city}</div></div>) },
            { label: "Phone", key: "phone" },
            { label: "Insurer", key: "insurer" },
            { label: "Visits", key: "visits", align: "center" },
            { label: "No-shows", align: "center", render: (p) => (p.noshows ? <span style={{ color: C.red, fontWeight: 600 }}>{p.noshows}</span> : 0) },
            { label: "Last visit", render: (p) => fmtDate(p.last_visit) },
            { label: "Next visit", render: (p) => (p.next_appointment ? `${fmtDate(p.next_appointment.date)} ${p.next_appointment.time}` : "—") },
            { label: "Next-visit risk", render: (p) => (p.next_appointment?.prob != null ? <RiskBadge prob={p.next_appointment.prob} /> : <span style={{ color: C.tx4 }}>—</span>) },
            { label: "Balance", align: "right", render: (p) => (p.balance > 0 ? <span style={{ color: C.amb, fontWeight: 600 }}>{eur(p.balance, 2)}</span> : "—") },
          ]}
        />
        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: C.tx3 }}>
          <span>{rows.length.toLocaleString()} patients</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Button small variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>‹ Prev</Button>
            <span>Page {page + 1} / {pages}</span>
            <Button small variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next ›</Button>
          </div>
        </div>
      </Card>

      {selected && <PatientDrawer id={selected} onClose={() => setSelected(null)} />}
      {adding && <NewPatient onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
    </Page>
  );
}

function PatientDrawer({ id, onClose }) {
  const { data, error, loading } = useApi(`/api/patients/${id}`);
  const [tab, setTab] = useState("appointments");

  return (
    <Modal title={data ? data.patient.name : "Patient"} onClose={onClose} width={820}>
      {loading && <Loading />}
      {error && <Notice tone="error">{error}</Notice>}
      {data && (() => {
        const p = data.patient;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Grid cols="repeat(4, 1fr)" min={160}>
              <Stat label="Visits" value={p.visits} color={C.ind} />
              <Stat label="No-show rate" value={`${Math.round(p.noshow_rate * 100)}%`} color={p.noshow_rate >= 0.3 ? C.red : C.grn} />
              <Stat label="Lifetime value" value={eur(p.lifetime_value)} color={C.grn} />
              <Stat label="Balance due" value={eur(p.balance, 2)} color={p.balance > 0 ? C.amb : C.tx3} />
            </Grid>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, fontSize: 13, color: C.tx2, background: C.bg, padding: 12, borderRadius: 8 }}>
              <div><b>ID:</b> {p.id}</div>
              <div><b>Born:</b> {fmtDate(p.dob)} ({p.age} y)</div>
              <div><b>Phone:</b> {p.phone}</div>
              <div><b>Email:</b> {p.email}</div>
              <div><b>City:</b> {p.city}</div>
              <div><b>Insurer:</b> {p.insurer}</div>
              <div><b>Allergies:</b> {p.allergies}</div>
              <div><b>Conditions:</b> {[p.hypertension && "Hypertension", p.diabetes && "Diabetes", p.smoker && "Smoker"].filter(Boolean).join(", ") || "None recorded"}</div>
              <div><b>SMS reminders:</b> {p.sms_opt_in ? "Yes" : "No"} · <b>GDPR consent:</b> {p.gdpr_consent ? "Yes" : "No"}</div>
            </div>
            <Tabs active={tab} onChange={setTab} tabs={[
              { key: "appointments", label: "Appointments", count: data.appointments.length },
              { key: "invoices", label: "Invoices", count: data.invoices.length },
              { key: "plans", label: "Treatment plans", count: data.plans.length },
              { key: "labs", label: "Lab orders", count: data.lab_orders.length },
            ]} />
            {tab === "appointments" && (
              <Table maxHeight={300} rows={data.appointments} columns={[
                { label: "Date", render: (a) => `${fmtDate(a.date)} ${a.time}` },
                { label: "Treatment", key: "treatment_name" },
                { label: "Provider", key: "provider" },
                { label: "Fee", align: "right", render: (a) => eur(a.fee) },
                { label: "Status", render: (a) => <Badge>{a.status}</Badge> },
                { label: "Risk", render: (a) => (a.prob != null ? <RiskBadge prob={a.prob} /> : "—") },
              ]} />
            )}
            {tab === "invoices" && (
              <Table maxHeight={300} rows={data.invoices} columns={[
                { label: "Invoice", key: "id" }, { label: "Date", render: (i) => fmtDate(i.date) },
                { label: "Amount", align: "right", render: (i) => eur(i.amount, 2) }, { label: "Patient pays", align: "right", render: (i) => eur(i.patient_amount, 2) },
                { label: "Status", render: (i) => <Badge>{i.status}</Badge> },
              ]} />
            )}
            {tab === "plans" && (
              <Table rows={data.plans} columns={[
                { label: "Plan", key: "title", wrap: true }, { label: "Created", render: (pl) => fmtDate(pl.created) },
                { label: "Total", align: "right", render: (pl) => eur(pl.total) }, { label: "Status", render: (pl) => <Badge>{pl.status}</Badge> },
              ]} />
            )}
            {tab === "labs" && (
              <Table rows={data.lab_orders} columns={[
                { label: "Order", key: "id" }, { label: "Type", key: "type" }, { label: "Lab", key: "lab" },
                { label: "Due", render: (l) => fmtDate(l.due_date) }, { label: "Status", render: (l) => <Badge>{l.status}</Badge> },
              ]} />
            )}
          </div>
        );
      })()}
    </Modal>
  );
}

function NewPatient({ onClose, onSaved }) {
  const [f, setF] = useState({ first_name: "", last_name: "", phone: "", email: "", gender: "F", dob: "", city: "Košice", insurer: "VšZP", allergies: "None", hypertension: 0, diabetes: 0, smoker: 0, sms_opt_in: true });
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setErr(null);
    if (f.first_name.trim().length < 2 || f.last_name.trim().length < 2) return setErr("Enter first and last name.");
    const phone = normalizePhone(f.phone);
    if (!phone) return setErr("Enter a valid mobile number, e.g. 0905 123 456 or +421 905 123 456.");
    setSaving(true);
    try {
      await api("/api/patients", { method: "POST", body: { ...f, phone, dob: f.dob || null } });
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New patient" onClose={onClose} width={560}>
      {err && <div style={{ marginBottom: 12 }}><Notice tone="error">{err}</Notice></div>}
      <Grid cols="1fr 1fr" gap={12}>
        <Field label="First name"><Input value={f.first_name} onChange={set("first_name")} /></Field>
        <Field label="Last name"><Input value={f.last_name} onChange={set("last_name")} /></Field>
        <Field label="Phone" hint={f.phone ? (normalizePhone(f.phone) ? `✓ ${normalizePhone(f.phone)}` : "Number looks incomplete") : PHONE_HELP}><Input value={f.phone} onChange={set("phone")} placeholder="0905 123 456" /></Field>
        <Field label="Email"><Input value={f.email} onChange={set("email")} /></Field>
        <Field label="Date of birth"><Input type="date" value={f.dob} onChange={set("dob")} /></Field>
        <Field label="Gender"><Select value={f.gender} onChange={set("gender")} options={[{ value: "F", label: "Female" }, { value: "M", label: "Male" }]} /></Field>
        <Field label="City"><Input value={f.city} onChange={set("city")} /></Field>
        <Field label="Health insurer"><Select value={f.insurer} onChange={set("insurer")} options={["VšZP", "Dôvera", "Union", "Private / none"]} /></Field>
        <Field label="Allergies"><Input value={f.allergies} onChange={set("allergies")} /></Field>
      </Grid>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <Toggle checked={!!f.hypertension} onChange={(v) => setF({ ...f, hypertension: v ? 1 : 0 })} label="Hypertension" />
        <Toggle checked={!!f.diabetes} onChange={(v) => setF({ ...f, diabetes: v ? 1 : 0 })} label="Diabetes" />
        <Toggle checked={!!f.smoker} onChange={(v) => setF({ ...f, smoker: v ? 1 : 0 })} label="Smoker" />
        <Toggle checked={f.sms_opt_in} onChange={(v) => setF({ ...f, sms_opt_in: v })} label="SMS reminders" />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save patient"}</Button>
      </div>
    </Modal>
  );
}
