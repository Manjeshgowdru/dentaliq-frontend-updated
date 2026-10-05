import { useMemo, useState } from "react";
import { api, urlParam, useApi } from "../api";
import { Badge, Button, C, Card, ErrorState, Field, Grid, Input, Loading, Modal, Notice, Page, PageHeader, Progress, SearchBox, Select, Stat, Table, Tabs, eur, fmtDate } from "../components/ui";

export default function Stock({ onNavigate }) {
  const { data, error, loading, reload } = useApi("/api/stock");
  const [tab, setTab] = useState("all");
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState(() => urlParam("q") || "");
  const [adjusting, setAdjusting] = useState(null);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState(null);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.items.filter((x) => {
      if (tab === "low" && x.state === "OK") return false;
      if (tab === "expiring" && !x.expiring_soon) return false;
      if (cat !== "All" && x.category !== cat) return false;
      if (q && !x.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, tab, cat, q]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const s = data.summary;

  const autoReorder = async () => {
    try {
      const r = await api("/api/procurement/auto-reorder", { method: "POST" });
      setMsg(r.created.length ? `Created ${r.created.length} draft purchase order(s): ${r.created.map((p) => p.id).join(", ")}. Review them in Procurement.` : "All low-stock items are already on order.");
      reload();
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Stock Manager"
        subtitle="Clinical consumables, minimum levels, expiry dates and reordering"
        actions={<>
          <Button variant="secondary" onClick={() => setAdding(true)}>+ Add item</Button>
          <Button onClick={autoReorder}>🛒 Reorder low stock</Button>
        </>}
      />
      {msg && <Notice tone="success">{msg} {onNavigate && <a style={{ color: C.ind, cursor: "pointer", fontWeight: 600 }} onClick={() => onNavigate("procurement")}>Open Procurement →</a>}</Notice>}

      <Grid cols="repeat(5, 1fr)" min={170}>
        <Stat label="Items tracked" value={s.items} color={C.ind} />
        <Stat label="Below minimum" value={s.low} color={C.amb} />
        <Stat label="Out of stock" value={s.out} color={C.red} />
        <Stat label="Expiring ≤ 60 days" value={s.expiring} color={C.vio} />
        <Stat label="Stock value" value={eur(s.value)} color={C.grn} />
      </Grid>

      <Card pad={0}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Tabs active={tab} onChange={setTab} tabs={[{ key: "all", label: "All", count: s.items }, { key: "low", label: "Needs reorder", count: s.low + s.out }, { key: "expiring", label: "Expiring soon", count: s.expiring }]} />
          <div style={{ display: "flex", gap: 8 }}>
            <Select value={cat} onChange={(e) => setCat(e.target.value)} options={["All", ...s.categories]} style={{ width: 170 }} />
            <SearchBox value={q} onChange={setQ} placeholder="Search items" />
          </div>
        </div>
        <Table rows={rows} columns={[
          { label: "Item", render: (x) => (<div><div style={{ fontWeight: 600, color: C.tx1 }}>{x.name}</div><div style={{ fontSize: 11, color: C.tx4 }}>{x.category} · {x.location}</div></div>) },
          { label: "In stock", render: (x) => (
            <div style={{ minWidth: 120 }}>
              <div style={{ fontSize: 12, marginBottom: 3 }}><b style={{ color: x.state === "OK" ? C.tx1 : C.red }}>{x.qty}</b> / min {x.min_qty} {x.unit}</div>
              <Progress value={(x.qty / (x.min_qty * 2)) * 100} color={x.state === "OK" ? C.grn : x.state === "Low" ? C.amb : C.red} />
            </div>
          ) },
          { label: "Status", render: (x) => <Badge>{x.state}</Badge> },
          { label: "Cover", render: (x) => (x.weeks_left != null ? `${x.weeks_left} wk` : "—") },
          { label: "On order", align: "center", render: (x) => (x.on_order ? <Badge tone="blue">+{x.on_order}</Badge> : "—") },
          { label: "Expiry", render: (x) => (x.expiry ? <span style={{ color: x.expiring_soon ? C.red : C.tx2 }}>{fmtDate(x.expiry)}</span> : "—") },
          { label: "Supplier", key: "supplier" },
          { label: "Unit cost", align: "right", render: (x) => eur(x.unit_cost, 2) },
          { label: "", render: (x) => <Button small variant="secondary" onClick={() => setAdjusting(x)}>Adjust</Button> },
        ]} />
      </Card>

      {adjusting && <AdjustModal item={adjusting} onClose={() => setAdjusting(null)} onSaved={() => { setAdjusting(null); reload(); }} />}
      {adding && <AddItemModal categories={s.categories} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
    </Page>
  );
}

function AdjustModal({ item, onClose, onSaved }) {
  const [delta, setDelta] = useState(-1);
  const [minQty, setMinQty] = useState(item.min_qty);
  const [err, setErr] = useState(null);
  const save = async () => {
    try {
      await api(`/api/stock/${item.id}`, { method: "PATCH", body: { adjust: Number(delta), min_qty: Number(minQty) } });
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal title={`Adjust: ${item.name}`} onClose={onClose} width={420}>
      {err && <Notice tone="error">{err}</Notice>}
      <div style={{ fontSize: 13, color: C.tx3, marginBottom: 12 }}>Currently {item.qty} {item.unit}(s) in stock.</div>
      <Field label="Change quantity" hint="Negative = used / removed, positive = added. New stock arriving from an order is added automatically when the order is received in Procurement.">
        <div style={{ display: "flex", gap: 6 }}>
          {[-5, -1, 1, 5, 10].map((v) => <Button key={v} small variant={Number(delta) === v ? "primary" : "secondary"} onClick={() => setDelta(v)}>{v > 0 ? `+${v}` : v}</Button>)}
          <Input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} style={{ width: 80 }} />
        </div>
      </Field>
      <Field label="Minimum level"><Input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} /></Field>
      <div style={{ fontSize: 13, marginBottom: 12 }}>New quantity: <b>{Math.max(0, item.qty + Number(delta || 0))}</b></div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </div>
    </Modal>
  );
}

function AddItemModal({ categories, onClose, onSaved }) {
  const [f, setF] = useState({ name: "", category: categories[0] || "Disposables", unit: "box", qty: 0, min_qty: 5, reorder_qty: 10, unit_cost: 0, supplier_id: "S1", weekly_usage: 1, expiry: "" });
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    if (f.name.trim().length < 2) return setErr("Enter an item name.");
    try {
      await api("/api/stock", { method: "POST", body: { ...f, qty: Number(f.qty), min_qty: Number(f.min_qty), reorder_qty: Number(f.reorder_qty), unit_cost: Number(f.unit_cost), weekly_usage: Number(f.weekly_usage), expiry: f.expiry || null } });
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal title="Add stock item" onClose={onClose} width={520}>
      {err && <Notice tone="error">{err}</Notice>}
      <Field label="Name"><Input value={f.name} onChange={set("name")} /></Field>
      <Grid cols="1fr 1fr" gap={12}>
        <Field label="Category"><Select value={f.category} onChange={set("category")} options={categories} /></Field>
        <Field label="Unit"><Input value={f.unit} onChange={set("unit")} /></Field>
        <Field label="Quantity"><Input type="number" value={f.qty} onChange={set("qty")} /></Field>
        <Field label="Minimum level"><Input type="number" value={f.min_qty} onChange={set("min_qty")} /></Field>
        <Field label="Reorder quantity"><Input type="number" value={f.reorder_qty} onChange={set("reorder_qty")} /></Field>
        <Field label="Unit cost (€)"><Input type="number" value={f.unit_cost} onChange={set("unit_cost")} /></Field>
        <Field label="Supplier"><Select value={f.supplier_id} onChange={set("supplier_id")} options={[{ value: "S1", label: "DentaMed Distribution" }, { value: "S2", label: "ProDent Supply SK" }, { value: "S3", label: "SteriClean Medical" }, { value: "S4", label: "ImplantLine Europe" }, { value: "S5", label: "OrthoSmile Partners" }]} /></Field>
        <Field label="Expiry (optional)"><Input type="date" value={f.expiry} onChange={set("expiry")} /></Field>
      </Grid>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Add item</Button>
      </div>
    </Modal>
  );
}
