import { useState } from "react";
import { api, useApi } from "../api";
import { Badge, Button, C, Card, ErrorState, Grid, Input, Loading, Modal, Notice, Page, PageHeader, Progress, Stat, Table, Tabs, fmtDate, todayIso } from "../components/ui";

export default function Equipment() {
  const [tab, setTab] = useState("schedule");
  const [day, setDay] = useState(todayIso());
  const list = useApi("/api/equipment");
  const sched = useApi(`/api/equipment/schedule?date=${day}`);
  const [selected, setSelected] = useState(null);

  if (list.loading && !list.data) return <Loading />;
  if (list.error) return <ErrorState error={list.error} onRetry={list.reload} />;
  const s = list.data.summary;

  return (
    <Page>
      <PageHeader
        title="Equipment Scheduler"
        subtitle="Chair and device schedule, utilisation and maintenance"
        actions={tab === "schedule" && <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} style={{ width: 160 }} />}
      />
      <Grid cols="repeat(5, 1fr)" min={170}>
        <Stat label="Equipment tracked" value={s.total} color={C.ind} />
        <Stat label="Operational" value={s.operational} color={C.grn} />
        <Stat label="In maintenance" value={s.maintenance} color={C.amb} />
        <Stat label="Service due / overdue" value={s.service_due} color={C.red} />
        <Stat label="Avg chair utilisation (30d)" value={`${s.avg_chair_util}%`} color={C.tea} />
      </Grid>

      <Tabs active={tab} onChange={setTab} tabs={[{ key: "schedule", label: "Daily schedule" }, { key: "assets", label: "Equipment & maintenance" }]} />

      {tab === "schedule" && <ScheduleGrid sched={sched} />}

      {tab === "assets" && (
        <Card pad={0}>
          <Table rows={list.data.equipment} onRowClick={setSelected} columns={[
            { label: "Equipment", render: (e) => (<div><div style={{ fontWeight: 600, color: C.tx1 }}>{e.name}</div><div style={{ fontSize: 11, color: C.tx4 }}>{e.type} · {e.location} · {e.serial}</div></div>) },
            { label: "Status", render: (e) => <Badge>{e.status}</Badge> },
            { label: "Utilisation (30d)", render: (e) => (e.utilization != null ? <div style={{ width: 120 }}><div style={{ fontSize: 12, marginBottom: 3 }}>{e.utilization}%</div><Progress value={e.utilization} color={C.tea} /></div> : "—") },
            { label: "Last service", render: (e) => fmtDate(e.last_service) },
            { label: "Next service", render: (e) => <span style={{ color: e.service_state === "OK" ? C.tx2 : C.red }}>{fmtDate(e.next_service)}</span> },
            { label: "Service", render: (e) => <Badge>{e.service_state === "OK" ? "OK" : e.service_state}</Badge> },
          ]} />
        </Card>
      )}

      {selected && <EquipmentModal eq={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); list.reload(); sched.reload(); }} />}
    </Page>
  );
}

function ScheduleGrid({ sched }) {
  if (sched.loading && !sched.data) return <Loading />;
  if (sched.error) return <ErrorState error={sched.error} onRetry={sched.reload} />;
  const d = sched.data;
  if (d.closed) return <Notice tone="info">The clinic is closed on {fmtDate(d.date)} (see Settings → Opening hours).</Notice>;
  const slotIndex = Object.fromEntries(d.slots.map((s, i) => [s, i]));
  const colW = 64;

  return (
    <Card pad={0}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 200 + d.slots.length * colW }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${C.br}`, background: C.bg }}>
            <div style={{ width: 200, flexShrink: 0, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: C.tx3, textTransform: "uppercase" }}>Resource</div>
            {d.slots.map((s) => <div key={s} style={{ width: colW, flexShrink: 0, padding: "8px 4px", fontSize: 11, color: C.tx3, fontFamily: "monospace", borderLeft: `1px solid ${C.br2}` }}>{s}</div>)}
          </div>
          {d.resources.map((r) => (
            <div key={r.id} style={{ display: "flex", borderBottom: `1px solid ${C.br2}`, position: "relative", height: 54 }}>
              <div style={{ width: 200, flexShrink: 0, padding: "8px 12px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.tx1 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: r.status === "Operational" ? C.tx4 : C.red }}>{r.status === "Operational" ? `${r.bookings.length} booking(s)` : r.status}</div>
              </div>
              <div style={{ position: "relative", flex: 1, background: r.status === "Operational" ? "#fff" : "repeating-linear-gradient(45deg,#FEF2F2,#FEF2F2 6px,#fff 6px,#fff 12px)" }}>
                {d.slots.map((s, i) => <div key={s} style={{ position: "absolute", left: i * colW, top: 0, bottom: 0, borderLeft: `1px solid ${C.br2}` }} />)}
                {r.bookings.map((b) => {
                  const start = slotIndex[b.time];
                  if (start === undefined) return null;
                  const width = Math.max(1, b.duration / d.slot_minutes) * colW - 4;
                  return (
                    <div key={b.id + r.id} title={`${b.time} · ${b.patient} · ${b.treatment} · ${b.provider}`} style={{ position: "absolute", left: start * colW + 2, top: 6, height: 42, width, background: `${b.color}1A`, borderLeft: `3px solid ${b.color}`, borderRadius: 4, padding: "3px 6px", overflow: "hidden", opacity: b.status === "No-show" ? 0.45 : 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.tx1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.patient}</div>
                      <div style={{ fontSize: 10, color: C.tx3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.treatment}{b.status === "No-show" ? " · no-show" : ""}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function EquipmentModal({ eq, onClose, onSaved }) {
  const [note, setNote] = useState("");
  const [err, setErr] = useState(null);
  const patch = async (body) => {
    try {
      await api(`/api/equipment/${eq.id}`, { method: "PATCH", body });
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal title={eq.name} onClose={onClose} width={520}>
      {err && <Notice tone="error">{err}</Notice>}
      <div style={{ fontSize: 13, color: C.tx2, lineHeight: 1.8, marginBottom: 12 }}>
        <div><b>Type:</b> {eq.type} · <b>Location:</b> {eq.location}</div>
        <div><b>Serial:</b> {eq.serial} · <b>Installed:</b> {fmtDate(eq.installed)}</div>
        <div><b>Service interval:</b> every {eq.service_interval_days} days · <b>Next:</b> {fmtDate(eq.next_service)} ({eq.days_to_service >= 0 ? `in ${eq.days_to_service} days` : `${-eq.days_to_service} days overdue`})</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["Operational", "Maintenance", "Out of service"].map((st) => (
          <Button key={st} small variant={eq.status === st ? "primary" : "secondary"} onClick={() => patch({ status: st })}>{st}</Button>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.tx3, textTransform: "uppercase", marginBottom: 4 }}>Log a completed service</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Annual service, filters replaced" />
        <Button onClick={() => patch({ log_service: true, note })}>Log service</Button>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.tx3, textTransform: "uppercase", marginBottom: 4 }}>Service history</div>
      {eq.service_log.map((l, i) => <div key={i} style={{ fontSize: 12, color: C.tx2, padding: "4px 0", borderBottom: `1px solid ${C.br2}` }}>{fmtDate(l.date)} — {l.note}</div>)}
    </Modal>
  );
}
