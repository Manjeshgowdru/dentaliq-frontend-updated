import { useState } from "react";
import { api, useApi } from "../api";
import { Badge, Button, C, Card, ErrorState, Field, Grid, Input, Loading, Modal, Notice, Page, PageHeader, Select, Stat, Table, Tabs, eur, fmtDate } from "../components/ui";

const NEXT = { Draft: ["Ordered", "Cancelled"], Ordered: ["Received", "Cancelled"] };

export default function Procurement() {
  const { data, error, loading, reload } = useApi("/api/procurement");
  const [tab, setTab] = useState("open");
  const [view, setView] = useState(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState(null);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const s = data.summary;
  const orders = data.orders.filter((o) => (tab === "open" ? ["Draft", "Ordered"].includes(o.status) : tab === "all" ? true : o.status === tab));

  const setStatus = async (po, status) => {
    try {
      await api(`/api/procurement/orders/${po.id}`, { method: "PATCH", body: { status } });
      setMsg(status === "Received" ? `${po.id} received — ${po.lines.length} item(s) added to stock.` : `${po.id} marked as ${status}.`);
      setView(null);
      reload();
    } catch (e) {
      setMsg(e.message);
    }
  };

  const autoReorder = async () => {
    const r = await api("/api/procurement/auto-reorder", { method: "POST" });
    setMsg(r.created.length ? `Created ${r.created.length} draft order(s) from low stock.` : "All low-stock items are already on order.");
    reload();
  };

  return (
    <Page>
      <PageHeader
        title="Procurement"
        subtitle="Purchase orders and suppliers — receiving an order updates stock automatically"
        actions={<>
          <Button variant="secondary" onClick={autoReorder}>⚡ Draft from low stock ({s.low_stock_items})</Button>
          <Button onClick={() => setCreating(true)}>+ New purchase order</Button>
        </>}
      />
      {msg && <Notice tone="success">{msg}</Notice>}

      <Grid cols="repeat(5, 1fr)" min={170}>
        <Stat label="Open orders" value={s.open} color={C.ind} />
        <Stat label="Drafts to approve" value={s.drafts} color={C.vio} />
        <Stat label="Late deliveries" value={s.overdue} color={C.red} />
        <Stat label="Low-stock items" value={s.low_stock_items} color={C.amb} />
        <Stat label="Spend this month" value={eur(s.spend_mtd)} color={C.grn} />
      </Grid>

      <Card pad={0}>
        <div style={{ padding: "12px 16px" }}>
          <Tabs active={tab} onChange={setTab} tabs={[{ key: "open", label: "Open" }, { key: "Draft", label: "Drafts" }, { key: "Ordered", label: "Ordered" }, { key: "Received", label: "Received" }, { key: "all", label: "All" }]} />
        </div>
        <Table rows={orders} onRowClick={setView} empty="No purchase orders here." columns={[
          { label: "Order", render: (o) => <b style={{ color: C.tx1 }}>{o.id}</b> },
          { label: "Supplier", key: "supplier" },
          { label: "Items", render: (o) => `${o.lines.length} line(s)` },
          { label: "Created", render: (o) => fmtDate(o.created) },
          { label: "Expected", render: (o) => <span style={{ color: o.overdue ? C.red : C.tx2 }}>{fmtDate(o.expected)}{o.overdue ? " (late)" : ""}</span> },
          { label: "Total", align: "right", render: (o) => eur(o.total, 2) },
          { label: "Status", render: (o) => <Badge>{o.status}</Badge> },
          { label: "", render: (o) => (
            <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
              {o.status === "Draft" && <Button small onClick={() => setStatus(o, "Ordered")}>Send order</Button>}
              {o.status === "Ordered" && <Button small variant="success" onClick={() => setStatus(o, "Received")}>Mark received</Button>}
            </div>
          ) },
        ]} />
      </Card>

      <Card title="Suppliers">
        <Table rows={data.suppliers} columns={[
          { label: "Supplier", render: (s2) => <b style={{ color: C.tx1 }}>{s2.name}</b> },
          { label: "Category", key: "category" },
          { label: "Contact", render: (s2) => <span style={{ fontSize: 12 }}>{s2.email}<br />{s2.phone}</span> },
          { label: "Lead time", render: (s2) => `${s2.lead_days} days` },
          { label: "Rating", render: (s2) => `★ ${s2.rating}` },
          { label: "Open orders", key: "open_orders", align: "center" },
          { label: "Spend (received)", align: "right", render: (s2) => eur(s2.spend) },
        ]} />
      </Card>

      {view && (
        <Modal title={`${view.id} · ${view.supplier}`} onClose={() => setView(null)} width={600}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
            <Badge>{view.status}</Badge>
            <span style={{ fontSize: 12, color: C.tx3 }}>Created {fmtDate(view.created)} · expected {fmtDate(view.expected)}{view.received_date ? ` · received ${fmtDate(view.received_date)}` : ""}</span>
          </div>
          <Table rows={view.lines} columns={[
            { label: "Item", key: "name" },
            { label: "Qty", key: "qty", align: "center" },
            { label: "Unit cost", align: "right", render: (l) => eur(l.unit_cost, 2) },
            { label: "Line total", align: "right", render: (l) => eur(l.qty * l.unit_cost, 2) },
          ]} />
          <div style={{ textAlign: "right", fontWeight: 700, margin: "12px 0", fontSize: 14 }}>Total {eur(view.total, 2)}</div>
          {view.notes && <div style={{ fontSize: 12, color: C.tx3, marginBottom: 12 }}>Note: {view.notes}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {(NEXT[view.status] || []).map((st) => (
              <Button key={st} variant={st === "Cancelled" ? "danger" : st === "Received" ? "success" : "primary"} onClick={() => setStatus(view, st)}>
                {st === "Ordered" ? "Send order" : st === "Received" ? "Mark received (adds to stock)" : "Cancel order"}
              </Button>
            ))}
          </div>
        </Modal>
      )}
      {creating && <NewPO suppliers={data.suppliers} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
    </Page>
  );
}

function NewPO({ suppliers, onClose, onSaved }) {
  const { data: stock } = useApi("/api/stock");
  const [supplier, setSupplier] = useState(suppliers[0]?.id);
  const [qty, setQty] = useState({});
  const [err, setErr] = useState(null);
  const items = (stock?.items || []).filter((x) => x.supplier_id === supplier);
  const lines = Object.entries(qty).filter(([id, q]) => Number(q) > 0 && items.some((x) => x.id === id)).map(([stock_id, q]) => ({ stock_id, qty: Number(q) }));
  const total = lines.reduce((sum, l) => sum + l.qty * (items.find((x) => x.id === l.stock_id)?.unit_cost || 0), 0);

  const save = async () => {
    if (!lines.length) return setErr("Enter a quantity for at least one item.");
    try {
      await api("/api/procurement/orders", { method: "POST", body: { supplier_id: supplier, lines } });
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Modal title="New purchase order" onClose={onClose} width={640}>
      {err && <Notice tone="error">{err}</Notice>}
      <Field label="Supplier"><Select value={supplier} onChange={(e) => { setSupplier(e.target.value); setQty({}); }} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} /></Field>
      <Table maxHeight={320} rows={items} columns={[
        { label: "Item", key: "name" },
        { label: "Stock", render: (x) => <span style={{ color: x.state === "OK" ? C.tx2 : C.red }}>{x.qty} / {x.min_qty}</span> },
        { label: "Unit cost", align: "right", render: (x) => eur(x.unit_cost, 2) },
        { label: "Order qty", render: (x) => <Input type="number" min="0" value={qty[x.id] ?? ""} placeholder={x.state !== "OK" ? String(x.reorder_qty) : "0"} onChange={(e) => setQty({ ...qty, [x.id]: e.target.value })} style={{ width: 80 }} /> },
      ]} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <b>Total {eur(total, 2)}</b>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save as draft</Button>
        </div>
      </div>
    </Modal>
  );
}
