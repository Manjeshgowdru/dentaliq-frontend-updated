import { useMemo, useState } from "react";
import { api, urlParam, useApi } from "../api";
import { useSettings } from "../SettingsContext";
import { Badge, Button, C, Card, ErrorState, Field, Grid, Input, Loading, Modal, Notice, Page, PageHeader, SearchBox, Select, Stat, Table, Tabs, downloadCsv, eur, fmtDate } from "../components/ui";
import PatientPicker from "../components/PatientPicker";

export default function Billing() {
  const { data, error, loading, reload } = useApi("/api/invoices");
  const [tab, setTab] = useState(() => urlParam("status") || "all");
  const [q, setQ] = useState(() => urlParam("q") || "");
  const [view, setView] = useState(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState(null);

  const rows = useMemo(() => {
    if (!data) return [];
    const ql = q.toLowerCase();
    return data.invoices.filter((i) => (tab === "all" || i.status === tab) && (!ql || i.patient.toLowerCase().includes(ql) || i.id.toLowerCase().includes(ql)));
  }, [data, tab, q]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const s = data.summary;

  const markPaid = async (inv, method) => {
    await api(`/api/invoices/${inv.id}`, { method: "PATCH", body: { status: "Paid", method } });
    setMsg(`${inv.id} marked as paid (${method}).`);
    setView(null);
    reload();
  };

  return (
    <Page>
      <PageHeader
        title="Billing & Invoices"
        subtitle="Invoices, payments, insurance share and overdue balances"
        actions={<>
          <Button variant="secondary" onClick={() => downloadCsv("invoices.csv", rows, [
            { label: "Invoice", key: "id" }, { label: "Date", key: "date" }, { label: "Patient", key: "patient" }, { label: "Amount", key: "amount" },
            { label: "Insurance", key: "insurance_amount" }, { label: "Patient share", key: "patient_amount" }, { label: "Status", key: "status" }, { label: "Method", key: "method" },
          ])}>⬇ Export CSV</Button>
          <Button onClick={() => setCreating(true)}>+ New invoice</Button>
        </>}
      />
      {msg && <Notice tone="success">{msg}</Notice>}

      <Grid cols="repeat(5, 1fr)" min={170}>
        <Stat label="Invoiced (MTD)" value={eur(s.invoiced_mtd)} color={C.ind} />
        <Stat label="Collected (MTD)" value={eur(s.collected_mtd)} color={C.grn} />
        <Stat label="Insurance share (MTD)" value={eur(s.insurance_mtd)} sub="Claimed from VšZP / Dôvera / Union" color={C.tea} />
        <Stat label="Unpaid (not yet due)" value={eur(s.unpaid)} color={C.amb} />
        <Stat label="Overdue" value={eur(s.overdue)} color={C.red} />
      </Grid>

      <Card pad={0}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Tabs active={tab} onChange={setTab} tabs={[{ key: "all", label: "All" }, { key: "Unpaid", label: "Unpaid" }, { key: "Overdue", label: "Overdue" }, { key: "Paid", label: "Paid" }]} />
          <SearchBox value={q} onChange={setQ} placeholder="Patient or invoice no." />
        </div>
        <Table rows={rows.slice(0, 200)} onRowClick={setView} columns={[
          { label: "Invoice", render: (i) => <b style={{ color: C.tx1 }}>{i.id}</b> },
          { label: "Date", render: (i) => fmtDate(i.date) },
          { label: "Patient", key: "patient" },
          { label: "Description", render: (i) => i.items.map((it) => it.description).join(", "), wrap: true },
          { label: "Total", align: "right", render: (i) => eur(i.amount, 2) },
          { label: "Insurance", align: "right", render: (i) => (i.insurance_amount ? eur(i.insurance_amount, 2) : "—") },
          { label: "Patient pays", align: "right", render: (i) => <b>{eur(i.patient_amount, 2)}</b> },
          { label: "Due", render: (i) => fmtDate(i.due_date) },
          { label: "Status", render: (i) => <Badge>{i.status}</Badge> },
          { label: "", render: (i) => i.status !== "Paid" && <span onClick={(e) => e.stopPropagation()}><Button small variant="success" onClick={() => markPaid(i, "Card")}>Mark paid</Button></span> },
        ]} />
        {rows.length > 200 && <div style={{ padding: 10, fontSize: 12, color: C.tx3, textAlign: "center" }}>Showing latest 200 of {rows.length}. Use search or export for the rest.</div>}
      </Card>

      {view && <InvoiceModal inv={view} onClose={() => setView(null)} onPaid={markPaid} />}
      {creating && <NewInvoice onClose={() => setCreating(false)} onSaved={(inv) => { setCreating(false); setMsg(`Invoice ${inv.id} created.`); reload(); }} />}
    </Page>
  );
}

function InvoiceModal({ inv, onClose, onPaid }) {
  const { settings } = useSettings();
  const [method, setMethod] = useState("Card");
  const clinic = settings?.clinic || {};
  return (
    <Modal title={`Invoice ${inv.id}`} onClose={onClose} width={560}>
      <div id="invoice-print" style={{ fontSize: 13, color: C.tx2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.tx1 }}>{clinic.legal_name || clinic.name}</div>
            <div>{clinic.address}</div>
            <div>{clinic.phone} · {clinic.email}</div>
            {clinic.company_id && <div>IČO {clinic.company_id} {clinic.vat_id && `· IČ DPH ${clinic.vat_id}`}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <Badge>{inv.status}</Badge>
            <div style={{ marginTop: 6 }}>Issued {fmtDate(inv.date)}</div>
            <div>Due {fmtDate(inv.due_date)}</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}><b>Bill to:</b> {inv.patient} ({inv.patient_id})</div>
        <Table rows={inv.items} columns={[{ label: "Description", key: "description" }, { label: "Amount", align: "right", render: (l) => eur(l.amount, 2) }]} />
        <div style={{ textAlign: "right", marginTop: 10, lineHeight: 1.8 }}>
          <div>Total {eur(inv.amount, 2)}</div>
          <div>Covered by health insurance −{eur(inv.insurance_amount, 2)}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Patient pays {eur(inv.patient_amount, 2)}</div>
          {inv.status === "Paid" && <div style={{ color: C.grn }}>Paid {fmtDate(inv.paid_date)} by {inv.method}</div>}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={() => window.print()}>🖨 Print</Button>
        {inv.status !== "Paid" && <>
          <Select value={method} onChange={(e) => setMethod(e.target.value)} options={["Card", "Cash", "Bank transfer"]} style={{ width: 150 }} />
          <Button variant="success" onClick={() => onPaid(inv, method)}>Record payment</Button>
        </>}
      </div>
    </Modal>
  );
}

function NewInvoice({ onClose, onSaved }) {
  const { settings } = useSettings();
  const treatments = settings?.treatments || [];
  const [patient, setPatient] = useState(null);
  const [lines, setLines] = useState([{ description: treatments[0]?.name || "", amount: treatments[0]?.price || 0 }]);
  const [insurance, setInsurance] = useState(0);
  const [err, setErr] = useState(null);
  const total = lines.reduce((s, l) => s + Number(l.amount || 0), 0);

  const save = async () => {
    if (!patient) return setErr("Choose a patient.");
    try {
      const r = await api("/api/invoices", { method: "POST", body: { patient_id: patient.id, items: lines.map((l) => ({ description: l.description, amount: Number(l.amount) })), insurance_amount: Number(insurance) } });
      onSaved(r.invoice);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Modal title="New invoice" onClose={onClose} width={600}>
      {err && <Notice tone="error">{err}</Notice>}
      <Field label="Patient"><PatientPicker value={patient} onChange={setPatient} /></Field>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.tx3, textTransform: "uppercase", marginBottom: 6 }}>Lines</div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Select value="" onChange={(e) => { const t = treatments.find((x) => x.code === e.target.value); if (t) setLines(lines.map((x, j) => (j === i ? { description: t.name, amount: t.price } : x))); }} options={[{ value: "", label: "Pick treatment…" }, ...treatments.map((t) => ({ value: t.code, label: t.name }))]} style={{ width: 150 }} />
          <Input value={l.description} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
          <Input type="number" value={l.amount} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} style={{ width: 100 }} />
          <Button variant="secondary" onClick={() => setLines(lines.filter((_, j) => j !== i))} disabled={lines.length === 1}>✕</Button>
        </div>
      ))}
      <Button variant="ghost" onClick={() => setLines([...lines, { description: "", amount: 0 }])}>+ Add line</Button>
      <Field label="Covered by health insurance (€)"><Input type="number" value={insurance} onChange={(e) => setInsurance(e.target.value)} /></Field>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b>Total {eur(total, 2)} · patient pays {eur(Math.max(0, total - Number(insurance || 0)), 2)}</b>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Create invoice</Button>
        </div>
      </div>
    </Modal>
  );
}
