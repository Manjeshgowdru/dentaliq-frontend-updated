import { useState } from "react";
import { api, urlParam, useApi } from "../api";
import { useSettings } from "../SettingsContext";
import { Badge, Button, C, Card, ErrorState, Field, Grid, Input, Loading, Modal, Notice, Page, PageHeader, Progress, Select, Stat, Table, Tabs, eur, fmtDate } from "../components/ui";
import PatientPicker from "../components/PatientPicker";

const STATUSES = ["Proposed", "Accepted", "In progress", "Completed", "Declined"];

export default function Treatment() {
  const { data, error, loading, reload } = useApi("/api/treatment-plans");
  const [tab, setTab] = useState("active");
  const [view, setView] = useState(() => (urlParam("open") ? { id: urlParam("open") } : null));
  const [creating, setCreating] = useState(false);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const s = data.summary;
  const plans = data.plans.filter((p) => (tab === "active" ? ["Proposed", "Accepted", "In progress"].includes(p.status) : tab === "all" ? true : p.status === tab));

  return (
    <Page>
      <PageHeader title="Treatment & Plans" subtitle="Multi-visit treatment plans, acceptance and progress" actions={<Button onClick={() => setCreating(true)}>+ New treatment plan</Button>} />

      <Grid cols="repeat(5, 1fr)" min={170}>
        <Stat label="Plans" value={s.total} color={C.ind} />
        <Stat label="Acceptance rate" value={`${s.acceptance_rate}%`} sub="Accepted ÷ decided" color={C.grn} />
        <Stat label="Awaiting decision" value={s.by_status.Proposed || 0} sub={eur(s.pipeline_value)} color={C.vio} />
        <Stat label="In progress" value={(s.by_status["In progress"] || 0) + (s.by_status.Accepted || 0)} sub={`${eur(s.active_value)} still to deliver`} color={C.tea} />
        <Stat label="Declined" value={s.by_status.Declined || 0} color={C.red} />
      </Grid>

      <Card pad={0}>
        <div style={{ padding: "12px 16px" }}>
          <Tabs active={tab} onChange={setTab} tabs={[{ key: "active", label: "Active" }, ...STATUSES.map((st) => ({ key: st, label: st, count: s.by_status[st] || 0 })), { key: "all", label: "All" }]} />
        </div>
        <Table rows={plans} onRowClick={setView} empty="No plans in this group." columns={[
          { label: "Plan", render: (p) => (<div><div style={{ fontWeight: 600, color: C.tx1, whiteSpace: "normal", maxWidth: 280 }}>{p.title}</div><div style={{ fontSize: 11, color: C.tx4 }}>{p.id} · {p.items.length} item(s)</div></div>) },
          { label: "Patient", key: "patient" },
          { label: "Provider", key: "provider" },
          { label: "Created", render: (p) => fmtDate(p.created) },
          { label: "Value", align: "right", render: (p) => eur(p.total) },
          { label: "Progress", render: (p) => <div style={{ width: 110 }}><div style={{ fontSize: 11, marginBottom: 3 }}>{p.progress}%</div><Progress value={p.progress} color={p.status === "Completed" ? C.grn : C.ind} /></div> },
          { label: "Status", render: (p) => <Badge>{p.status}</Badge> },
        ]} />
      </Card>

      {view && <PlanModal planId={view.id} plans={data.plans} onClose={() => setView(null)} onChanged={reload} />}
      {creating && <NewPlan onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
    </Page>
  );
}

function PlanModal({ planId, plans, onClose, onChanged }) {
  const plan = plans.find((p) => p.id === planId);
  const [err, setErr] = useState(null);
  if (!plan) return null;
  const patch = async (body) => {
    try {
      await api(`/api/treatment-plans/${plan.id}`, { method: "PATCH", body });
      onChanged();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal title={plan.title} onClose={onClose} width={640}>
      {err && <Notice tone="error">{err}</Notice>}
      <div style={{ fontSize: 13, color: C.tx2, marginBottom: 12 }}>{plan.patient} · {plan.provider} · created {fmtDate(plan.created)} · <Badge>{plan.status}</Badge></div>
      <Table rows={plan.items.map((it, i) => ({ ...it, i }))} columns={[
        { label: "Done", render: (it) => <input type="checkbox" checked={it.done} disabled={plan.status === "Declined"} onChange={(e) => patch({ item_index: it.i, done: e.target.checked })} /> },
        { label: "Treatment", key: "name" },
        { label: "Tooth (FDI)", render: (it) => it.tooth || "—" },
        { label: "Price", align: "right", render: (it) => eur(it.price) },
      ]} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0" }}>
        <span style={{ fontSize: 13, color: C.tx3 }}>Completed {eur(plan.completed_value)} of {eur(plan.total)}</span>
        <b style={{ fontSize: 15 }}>Total {eur(plan.total)}</b>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {plan.status === "Proposed" && <><Button variant="danger" onClick={() => patch({ status: "Declined" })}>Patient declined</Button><Button onClick={() => patch({ status: "Accepted" })}>Patient accepted</Button></>}
        {plan.status === "Accepted" && <Button onClick={() => patch({ status: "In progress" })}>Start treatment</Button>}
        {plan.status === "In progress" && <Button variant="success" onClick={() => patch({ status: "Completed" })}>Mark completed</Button>}
        {plan.status === "Declined" && <Button variant="secondary" onClick={() => patch({ status: "Proposed" })}>Re-open as proposal</Button>}
      </div>
    </Modal>
  );
}

function NewPlan({ onClose, onSaved }) {
  const { settings } = useSettings();
  const treatments = settings?.treatments || [];
  const dentists = (settings?.team || []).filter((u) => u.role === "Dentist" || u.role === "Hygienist");
  const [patient, setPatient] = useState(null);
  const [provider, setProvider] = useState(dentists[0]?.id || "U1");
  const [items, setItems] = useState([{ code: treatments[0]?.code || "CONSULT", tooth: "" }]);
  const [err, setErr] = useState(null);
  const total = items.reduce((s, it) => s + (treatments.find((t) => t.code === it.code)?.price || 0), 0);

  const save = async () => {
    if (!patient) return setErr("Choose a patient.");
    try {
      await api("/api/treatment-plans", { method: "POST", body: { patient_id: patient.id, provider_id: provider, items: items.map((it) => ({ code: it.code, tooth: it.tooth ? Number(it.tooth) : null })) } });
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Modal title="New treatment plan" onClose={onClose} width={620}>
      {err && <Notice tone="error">{err}</Notice>}
      <Field label="Patient"><PatientPicker value={patient} onChange={setPatient} /></Field>
      <Field label="Provider"><Select value={provider} onChange={(e) => setProvider(e.target.value)} options={dentists.map((u) => ({ value: u.id, label: u.name }))} /></Field>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.tx3, textTransform: "uppercase", marginBottom: 6 }}>Treatments</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Select value={it.code} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} options={treatments.map((t) => ({ value: t.code, label: `${t.name} — ${eur(t.price)}` }))} />
          <Input placeholder="Tooth" value={it.tooth} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, tooth: e.target.value } : x)))} style={{ width: 80 }} />
          <Button variant="secondary" onClick={() => setItems(items.filter((_, j) => j !== i))} disabled={items.length === 1}>✕</Button>
        </div>
      ))}
      <Button variant="ghost" onClick={() => setItems([...items, { code: treatments[0]?.code, tooth: "" }])}>+ Add treatment</Button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <b>Total {eur(total)}</b>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Create plan</Button>
        </div>
      </div>
    </Modal>
  );
}
