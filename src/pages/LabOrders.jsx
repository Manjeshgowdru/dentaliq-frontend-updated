import { useEffect, useState } from "react";
import { api, urlParam, useApi } from "../api";
import { Badge, Button, C, Card, ErrorState, Field, Grid, Input, Loading, Modal, Notice, Page, PageHeader, Select, Stat, Table, Tabs, eur, fmtDate } from "../components/ui";
import PatientPicker from "../components/PatientPicker";

const FLOW = { Draft: "Sent", Sent: "In production", "In production": "Shipped", Shipped: "Received", Received: "Fitted" };

export default function LabOrders() {
  const { data, error, loading, reload } = useApi("/api/lab-orders");
  const [tab, setTab] = useState("active");
  const [view, setView] = useState(null);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    const id = urlParam("open");
    if (id && data) setView(data.orders.find((o) => o.id === id) || null);
  }, [data]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const s = data.summary;
  const orders = data.orders.filter((o) =>
    tab === "active" ? ["Draft", "Sent", "In production", "Shipped"].includes(o.status) : tab === "overdue" ? o.overdue : tab === "done" ? ["Received", "Fitted"].includes(o.status) : tab === "Remake" ? o.status === "Remake" : true);

  const advance = async (o, status) => {
    await api(`/api/lab-orders/${o.id}`, { method: "PATCH", body: { status } });
    setView(null);
    reload();
  };

  return (
    <Page>
      <PageHeader title="Lab Orders" subtitle="Crowns, bridges, dentures and aligners sent to dental laboratories" actions={<Button onClick={() => setCreating(true)}>+ New lab order</Button>} />
      {s.overdue > 0 && <Notice tone="warning">⚠️ {s.overdue} lab order(s) are past their due date — check with the lab before the patient's fitting appointment.</Notice>}

      <Grid cols="repeat(5, 1fr)" min={170}>
        <Stat label="Active orders" value={s.active} color={C.ind} />
        <Stat label="Due this week" value={s.due_this_week} color={C.tea} />
        <Stat label="Overdue" value={s.overdue} color={C.red} />
        <Stat label="Remakes" value={s.remakes} color={C.amb} />
        <Stat label="Lab cost (MTD)" value={eur(s.cost_mtd)} color={C.vio} />
      </Grid>

      <Card pad={0}>
        <div style={{ padding: "12px 16px" }}>
          <Tabs active={tab} onChange={setTab} tabs={[{ key: "active", label: "Active" }, { key: "overdue", label: "Overdue", count: s.overdue }, { key: "done", label: "Received / fitted" }, { key: "Remake", label: "Remakes" }, { key: "all", label: "All" }]} />
        </div>
        <Table rows={orders} onRowClick={setView} empty="No lab orders here." columns={[
          { label: "Order", render: (o) => <b style={{ color: C.tx1 }}>{o.id}</b> },
          { label: "Patient", key: "patient" },
          { label: "Work", render: (o) => (<div><div>{o.type}</div><div style={{ fontSize: 11, color: C.tx4 }}>{[o.tooth && `Tooth ${o.tooth}`, o.shade && `Shade ${o.shade}`].filter(Boolean).join(" · ") || "—"}</div></div>) },
          { label: "Lab", key: "lab" },
          { label: "Sent", render: (o) => fmtDate(o.sent_date) },
          { label: "Due", render: (o) => <span style={{ color: o.overdue ? C.red : C.tx2, fontWeight: o.overdue ? 600 : 400 }}>{fmtDate(o.due_date)}{o.overdue ? " · late" : ""}</span> },
          { label: "Cost", align: "right", render: (o) => eur(o.cost) },
          { label: "Status", render: (o) => <Badge>{o.status}</Badge> },
          { label: "", render: (o) => FLOW[o.status] && <span onClick={(e) => e.stopPropagation()}><Button small variant="secondary" onClick={() => advance(o, FLOW[o.status])}>→ {FLOW[o.status]}</Button></span> },
        ]} />
      </Card>

      {view && (
        <Modal title={`${view.id} · ${view.type}`} onClose={() => setView(null)} width={520}>
          <div style={{ fontSize: 13, color: C.tx2, lineHeight: 1.9 }}>
            <div><b>Patient:</b> {view.patient}</div>
            <div><b>Dentist:</b> {view.provider}</div>
            <div><b>Laboratory:</b> {view.lab}</div>
            <div><b>Tooth / shade:</b> {view.tooth || "—"} / {view.shade || "—"}</div>
            <div><b>Sent:</b> {fmtDate(view.sent_date)} · <b>Due:</b> {fmtDate(view.due_date)}</div>
            <div><b>Cost:</b> {eur(view.cost)} {view.plan_id && <>· <b>Plan:</b> {view.plan_id}</>}</div>
            <div><b>Status:</b> <Badge>{view.status}</Badge></div>
            {view.notes && <div><b>Notes:</b> {view.notes}</div>}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, flexWrap: "wrap" }}>
            {["Received", "Fitted", "Shipped"].includes(view.status) && <Button variant="danger" onClick={() => advance(view, "Remake")}>Request remake</Button>}
            {FLOW[view.status] && <Button onClick={() => advance(view, FLOW[view.status])}>Mark as {FLOW[view.status]}</Button>}
            {view.status === "Remake" && <Button onClick={() => advance(view, "Sent")}>Re-send to lab</Button>}
          </div>
        </Modal>
      )}
      {creating && <NewLab labs={data.labs} types={data.types} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
    </Page>
  );
}

function NewLab({ labs, types, onClose, onSaved }) {
  const [patient, setPatient] = useState(null);
  const [f, setF] = useState({ type: types[0].type, lab: labs[0], tooth: "", shade: "A2", cost: types[0].cost, notes: "" });
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    if (!patient) return setErr("Choose a patient.");
    try {
      await api("/api/lab-orders", { method: "POST", body: { patient_id: patient.id, type: f.type, lab: f.lab, tooth: f.tooth ? Number(f.tooth) : null, shade: f.shade || null, cost: Number(f.cost), notes: f.notes } });
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal title="New lab order" onClose={onClose} width={560}>
      {err && <Notice tone="error">{err}</Notice>}
      <Field label="Patient"><PatientPicker value={patient} onChange={setPatient} /></Field>
      <Grid cols="1fr 1fr" gap={12}>
        <Field label="Work type"><Select value={f.type} onChange={(e) => { const t = types.find((x) => x.type === e.target.value); setF({ ...f, type: e.target.value, cost: t?.cost ?? f.cost }); }} options={types.map((t) => ({ value: t.type, label: `${t.type} (${t.turnaround} days)` }))} /></Field>
        <Field label="Laboratory"><Select value={f.lab} onChange={set("lab")} options={labs} /></Field>
        <Field label="Tooth (FDI)"><Input value={f.tooth} onChange={set("tooth")} placeholder="e.g. 36" /></Field>
        <Field label="Shade (VITA)"><Select value={f.shade} onChange={set("shade")} options={["", "A1", "A2", "A3", "A3.5", "B1", "B2", "C1", "D2"]} /></Field>
        <Field label="Lab cost (€)"><Input type="number" value={f.cost} onChange={set("cost")} /></Field>
      </Grid>
      <Field label="Notes for the lab"><Input value={f.notes} onChange={set("notes")} /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Send to lab</Button>
      </div>
    </Modal>
  );
}
