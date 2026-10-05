import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { api, useApi } from "../api";
import { useSettings } from "../SettingsContext";
import VoiceAgent from "../voice/VoiceAgent";
import { Badge, Button, C, Card, ErrorState, Field, Grid, Input, Loading, Notice, Page, PageHeader, Select, Table, TextArea, Toggle, eur, fmtDate } from "../components/ui";

const SECTIONS = [
  { key: "clinic", icon: "🏥", label: "Clinic profile" },
  { key: "hours", icon: "🕘", label: "Opening hours & capacity" },
  { key: "treatments", icon: "🦷", label: "Treatments & pricing" },
  { key: "team", icon: "👥", label: "Team & roles" },
  { key: "risk", icon: "🤖", label: "AI & risk rules" },
  { key: "reminders", icon: "💬", label: "Reminders & messages" },
  { key: "voice", icon: "🎙️", label: "Voice receptionist" },
  { key: "booking", icon: "🌐", label: "Online booking" },
  { key: "notifications", icon: "🔔", label: "Notifications" },
  { key: "privacy", icon: "🔒", label: "Privacy & GDPR" },
  { key: "system", icon: "🔌", label: "Integrations & system" },
];

const DAYS = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]];

export default function Settings() {
  const { settings, setSettings } = useSettings();
  const [section, setSection] = useState("clinic");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (settings && !draft) setDraft(JSON.parse(JSON.stringify(settings)));
  }, [settings, draft]);

  if (!draft) return <Loading text="Loading settings…" />;
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const set = (path, value) => {
    const next = JSON.parse(JSON.stringify(draft));
    const keys = path.split(".");
    let o = next;
    keys.slice(0, -1).forEach((k) => (o = o[k]));
    o[keys[keys.length - 1]] = value;
    setDraft(next);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const saved = await api("/api/settings", { method: "PUT", body: draft });
      setSettings(saved);
      setDraft(JSON.parse(JSON.stringify(saved)));
      setMsg({ tone: "success", text: "Settings saved. Booking slots, risk badges and the booking page now use the new values." });
    } catch (e) {
      setMsg({ tone: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const resetAll = async () => {
    if (!window.confirm("Reset ALL settings to the defaults?")) return;
    const saved = await api("/api/settings/reset", { method: "POST" });
    setSettings(saved);
    setDraft(JSON.parse(JSON.stringify(saved)));
    setMsg({ tone: "success", text: "Settings reset to defaults." });
  };

  const props = { draft, set, setDraft };

  return (
    <Page>
      <PageHeader
        title="Settings"
        subtitle="Everything that controls how DentalIQ runs your clinic"
        actions={<>
          <Button variant="secondary" onClick={resetAll}>Reset to defaults</Button>
          <Button variant="secondary" disabled={!dirty} onClick={() => setDraft(JSON.parse(JSON.stringify(settings)))}>Discard changes</Button>
          <Button disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : dirty ? "Save changes" : "Saved ✓"}</Button>
        </>}
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 16, alignItems: "start" }}>
        <Card pad={6} style={{ position: "sticky", top: 8 }}>
          {SECTIONS.map((s) => (
            <div key={s.key} onClick={() => setSection(s.key)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, background: section === s.key ? "#EEF0FF" : "transparent", color: section === s.key ? C.ind : C.tx2, fontWeight: section === s.key ? 700 : 500 }}>
              <span>{s.icon}</span>{s.label}
            </div>
          ))}
        </Card>
        <div style={{ minWidth: 0 }}>
          {section === "clinic" && <ClinicSection {...props} />}
          {section === "hours" && <HoursSection {...props} />}
          {section === "treatments" && <TreatmentsSection {...props} />}
          {section === "team" && <TeamSection {...props} />}
          {section === "risk" && <RiskSection {...props} />}
          {section === "reminders" && <RemindersSection {...props} />}
          {section === "voice" && <VoiceSection {...props} />}
          {section === "booking" && <BookingSection {...props} />}
          {section === "notifications" && <NotificationsSection {...props} />}
          {section === "privacy" && <PrivacySection {...props} />}
          {section === "system" && <SystemSection />}
        </div>
      </div>
      {dirty && (
        <div style={{ position: "sticky", bottom: 12, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ background: C.tx1, color: "#fff", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 12, alignItems: "center", boxShadow: "0 8px 20px rgba(0,0,0,.2)", fontSize: 13 }}>
            You have unsaved changes
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </div>
      )}
    </Page>
  );
}

function ClinicSection({ draft, set }) {
  const c = draft.clinic;
  const f = (k) => ({ value: c[k] || "", onChange: (e) => set(`clinic.${k}`, e.target.value) });
  return (
    <Card title="Clinic profile">
      <Grid cols="1fr 1fr" gap={12}>
        <Field label="Clinic name" hint="Shown in the sidebar, booking page, invoices and messages"><Input {...f("name")} /></Field>
        <Field label="Legal name (on invoices)"><Input {...f("legal_name")} /></Field>
        <Field label="Address"><Input {...f("address")} /></Field>
        <Field label="Phone"><Input {...f("phone")} /></Field>
        <Field label="Email"><Input {...f("email")} /></Field>
        <Field label="Website"><Input {...f("website")} placeholder="https://" /></Field>
        <Field label="Company ID (IČO)"><Input {...f("company_id")} /></Field>
        <Field label="VAT ID (IČ DPH)"><Input {...f("vat_id")} /></Field>
        <Field label="Currency"><Select {...f("currency")} options={["EUR", "CZK", "HUF", "PLN"]} /></Field>
        <Field label="Timezone"><Select {...f("timezone")} options={["Europe/Bratislava", "Europe/Prague", "Europe/Vienna", "Europe/Budapest"]} /></Field>
        <Field label="Default patient language"><Select {...f("default_language")} options={[{ value: "sk", label: "Slovak" }, { value: "en", label: "English" }]} /></Field>
      </Grid>
    </Card>
  );
}

function HoursSection({ draft, set }) {
  return (
    <>
      <Card title="Opening hours" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.tx3, marginBottom: 12 }}>Online booking, the voice receptionist and the equipment scheduler only offer times inside these hours. Closed days have no slots.</div>
        {DAYS.map(([k, label]) => {
          const h = draft.hours[k];
          return (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "120px 140px 1fr 1fr", gap: 12, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.br2}` }}>
              <b style={{ fontSize: 13, color: C.tx1 }}>{label}</b>
              <Toggle checked={!h.closed} onChange={(v) => set(`hours.${k}.closed`, !v)} label={h.closed ? "Closed" : "Open"} />
              <Input type="time" value={h.open} disabled={h.closed} onChange={(e) => set(`hours.${k}.open`, e.target.value)} />
              <Input type="time" value={h.close} disabled={h.closed} onChange={(e) => set(`hours.${k}.close`, e.target.value)} />
            </div>
          );
        })}
      </Card>
      <Card title="Capacity">
        <Grid cols="1fr 1fr" gap={12}>
          <Field label="Booking slot length" hint="Smallest bookable unit; longer treatments use several slots">
            <Select value={draft.slot_minutes} onChange={(e) => set("slot_minutes", Number(e.target.value))} options={[15, 20, 30, 45, 60].map((m) => ({ value: m, label: `${m} minutes` }))} />
          </Field>
          <Field label="Dental chairs" hint="Used for chair utilisation and the equipment schedule">
            <Input type="number" min="1" max="12" value={draft.chairs} onChange={(e) => set("chairs", Number(e.target.value))} />
          </Field>
        </Grid>
      </Card>
    </>
  );
}

function TreatmentsSection({ draft, setDraft }) {
  const update = (i, k, v) => {
    const next = JSON.parse(JSON.stringify(draft));
    next.treatments[i][k] = v;
    setDraft(next);
  };
  const add = () => {
    const next = JSON.parse(JSON.stringify(draft));
    next.treatments.push({ code: `CUSTOM_${next.treatments.length + 1}`, name: "New treatment", name_sk: "Nové ošetrenie", category: "General", duration: 30, price: 50, online: false, icon: "🦷" });
    setDraft(next);
  };
  return (
    <Card title="Treatments & pricing" actions={<Button small onClick={add}>+ Add treatment</Button>}>
      <div style={{ fontSize: 12, color: C.tx3, marginBottom: 12 }}>Prices feed invoices, treatment plans and revenue forecasts. Treatments marked "Online" appear on the public booking page and can be booked by the voice receptionist.</div>
      <Table rows={draft.treatments.map((t, i) => ({ ...t, i }))} columns={[
        { label: "", render: (t) => <Input value={t.icon} onChange={(e) => update(t.i, "icon", e.target.value)} style={{ width: 44, textAlign: "center" }} /> },
        { label: "Name (EN)", render: (t) => <Input value={t.name} onChange={(e) => update(t.i, "name", e.target.value)} style={{ minWidth: 180 }} /> },
        { label: "Name (SK)", render: (t) => <Input value={t.name_sk} onChange={(e) => update(t.i, "name_sk", e.target.value)} style={{ minWidth: 180 }} /> },
        { label: "Category", render: (t) => <Select value={t.category} onChange={(e) => update(t.i, "category", e.target.value)} options={["General", "Hygiene", "Restorative", "Endodontics", "Surgery", "Prosthetics", "Implants", "Cosmetic", "Orthodontics"]} style={{ width: 130 }} /> },
        { label: "Minutes", render: (t) => <Input type="number" value={t.duration} onChange={(e) => update(t.i, "duration", Number(e.target.value))} style={{ width: 70 }} /> },
        { label: "Price €", render: (t) => <Input type="number" value={t.price} onChange={(e) => update(t.i, "price", Number(e.target.value))} style={{ width: 80 }} /> },
        { label: "Online", render: (t) => <input type="checkbox" checked={!!t.online} onChange={(e) => update(t.i, "online", e.target.checked)} /> },
      ]} />
    </Card>
  );
}

function TeamSection({ draft, setDraft }) {
  const update = (i, k, v) => {
    const next = JSON.parse(JSON.stringify(draft));
    next.team[i][k] = v;
    setDraft(next);
  };
  const add = () => {
    const next = JSON.parse(JSON.stringify(draft));
    next.team.push({ id: `U${next.team.length + 1}`, name: "", role: "Receptionist", specialty: "", email: "", color: "#64748B", active: true });
    setDraft(next);
  };
  return (
    <Card title="Team & roles" actions={<Button small onClick={add}>+ Add team member</Button>}>
      <div style={{ fontSize: 12, color: C.tx3, marginBottom: 12 }}>Roles control what each person will be able to see once staff login is enabled: <b>Admin</b> — everything incl. settings; <b>Dentist / Hygienist</b> — patients, plans, labs; <b>Receptionist</b> — appointments, billing, patients.</div>
      <Table rows={draft.team.map((u, i) => ({ ...u, i }))} columns={[
        { label: "Colour", render: (u) => <input type="color" value={u.color} onChange={(e) => update(u.i, "color", e.target.value)} style={{ width: 32, height: 28, border: "none", background: "none" }} /> },
        { label: "Name", render: (u) => <Input value={u.name} onChange={(e) => update(u.i, "name", e.target.value)} style={{ minWidth: 170 }} /> },
        { label: "Role", render: (u) => <Select value={u.role} onChange={(e) => update(u.i, "role", e.target.value)} options={["Admin", "Dentist", "Hygienist", "Receptionist", "Assistant"]} style={{ width: 130 }} /> },
        { label: "Specialty", render: (u) => <Input value={u.specialty} onChange={(e) => update(u.i, "specialty", e.target.value)} style={{ minWidth: 150 }} /> },
        { label: "Email", render: (u) => <Input value={u.email} onChange={(e) => update(u.i, "email", e.target.value)} style={{ minWidth: 190 }} /> },
        { label: "Active", render: (u) => <input type="checkbox" checked={u.active} onChange={(e) => update(u.i, "active", e.target.checked)} /> },
      ]} />
    </Card>
  );
}

function RiskSection({ draft, set }) {
  const r = draft.risk;
  const { data } = useApi("/api/system/status");
  const meta = data?.model?.meta;
  const slider = (k, label, color) => (
    <Field label={`${label}: ${Math.round(r[k] * 100)}%`}>
      <input type="range" min="0.05" max="0.9" step="0.01" value={r[k]} onChange={(e) => set(`risk.${k}`, Number(e.target.value))} style={{ width: "100%", accentColor: color }} />
    </Field>
  );
  const ok = r.moderate < r.high && r.high < r.critical;
  return (
    <>
      <Card title="Risk thresholds" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.tx3, marginBottom: 12 }}>The AI predicts each patient's chance of not showing up. These thresholds decide which level (and which action) each appointment gets. The model's probabilities are calibrated, so 30% means about 3 in 10 such patients really miss their visit.</div>
        {!ok && <Notice tone="error">Thresholds must increase: moderate &lt; high &lt; critical.</Notice>}
        {slider("moderate", "Moderate from", C.amb)}
        {slider("high", "High from", "#EA580C")}
        {slider("critical", "Critical from", C.red)}
        <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginTop: 4 }}>
          <div style={{ width: `${r.moderate * 100}%`, background: C.grn }} />
          <div style={{ width: `${(r.high - r.moderate) * 100}%`, background: C.amb }} />
          <div style={{ width: `${(r.critical - r.high) * 100}%`, background: "#EA580C" }} />
          <div style={{ flex: 1, background: C.red }} />
        </div>
      </Card>
      <Card title="Action per risk level" style={{ marginBottom: 16 }}>
        <Grid cols="1fr 1fr" gap={12}>
          {["low", "moderate", "high", "critical"].map((lvl) => (
            <Field key={lvl} label={`${lvl} risk`}><Input value={r.actions[lvl]} onChange={(e) => set(`risk.actions.${lvl}`, e.target.value)} /></Field>
          ))}
          <Field label="Deposit for critical-risk bookings (€)" hint="Shown to staff as the recommended deposit; online payment comes later"><Input type="number" value={r.deposit_eur} onChange={(e) => set("risk.deposit_eur", Number(e.target.value))} /></Field>
        </Grid>
      </Card>
      <Card title="Prediction model">
        {meta ? (
          <div style={{ fontSize: 13, color: C.tx2, lineHeight: 1.8 }}>
            <div><b>Version:</b> {meta.version} · {meta.algorithm}</div>
            <div><b>Validated AUC:</b> {meta.metrics.roc_auc} (advance bookings only: {meta.metrics.roc_auc_advance_bookings})</div>
            <div><b>Calibration:</b> predicts {(meta.metrics.mean_predicted * 100).toFixed(1)}% vs actual {(meta.metrics.actual_noshow_rate * 100).toFixed(1)}% no-shows</div>
            <div><b>Trained:</b> {fmtDate(meta.trained_at)} on {meta.training_rows.toLocaleString()} appointments ({meta.dataset})</div>
            <div><b>Inputs:</b> {meta.features.join(", ")}</div>
          </div>
        ) : <Loading text="Loading model info…" />}
      </Card>
    </>
  );
}

function RemindersSection({ draft, set }) {
  const r = draft.reminders;
  const sample = (tpl) => tpl.replace("{name}", "Eva Šimková").replace("{clinic}", draft.clinic.name).replace("{date}", "8 Oct 2026").replace("{time}", "10:30");
  return (
    <Card title="Reminders & messages">
      <Grid cols="1fr 1fr" gap={12}>
        <Field label="SMS confirmation — hours before"><Input type="number" value={r.sms_hours_before} onChange={(e) => set("reminders.sms_hours_before", Number(e.target.value))} /></Field>
        <Field label="WhatsApp reminder — hours before"><Input type="number" value={r.whatsapp_hours_before} onChange={(e) => set("reminders.whatsapp_hours_before", Number(e.target.value))} /></Field>
      </Grid>
      <Field label="Message template — Slovak" hint="Placeholders: {name} {clinic} {date} {time}"><TextArea value={r.template_sk} onChange={(e) => set("reminders.template_sk", e.target.value)} /></Field>
      <div style={{ marginBottom: 14 }}><Notice>Preview: {sample(r.template_sk)}</Notice></div>
      <Field label="Message template — English"><TextArea value={r.template_en} onChange={(e) => set("reminders.template_en", e.target.value)} /></Field>
      <Notice>Preview: {sample(r.template_en)}</Notice>
      <div style={{ fontSize: 12, color: C.tx3, marginTop: 12 }}>Today reminders are sent by staff with one click (WhatsApp click-to-chat / SMS app) — free. Automatic sending needs an SMS provider and is planned after launch.</div>
    </Card>
  );
}

function VoiceSection({ draft, set }) {
  const v = draft.voice;
  const { data } = useApi("/api/system/status");
  const configured = data?.integrations?.gemini_voice?.configured;
  const toggleLang = (lang) => set("voice.languages", v.languages.includes(lang) ? v.languages.filter((l) => l !== lang) : [...v.languages, lang]);
  const [testing, setTesting] = useState(false);
  return (
    <>
      <Card title="Try it" style={{ marginBottom: 16 }} actions={configured && !testing && <Button small onClick={() => setTesting(true)}>📞 Test call</Button>}>
        {testing ? (
          <VoiceAgent test compact onClose={() => setTesting(false)} />
        ) : (
          <div style={{ fontSize: 13, color: C.tx2, lineHeight: 1.6 }}>
            {configured
              ? <>Start a test call to talk to the receptionist yourself (works even when it is switched off for patients). Saved settings are used — save changes first. Bookings made in a test call go into the real clinic calendar.</>
              : <>The voice receptionist needs a free Gemini API key. Create one at <b>aistudio.google.com/apikey</b>, put it in <code>E:\dq-ml\.env</code> as <code>GEMINI_API_KEY=…</code> (see <code>.env.example</code>) and restart the backend. On Render add it under <b>Environment</b>.</>}
          </div>
        )}
      </Card>
      <Card title="AI voice receptionist" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13 }}>Engine: <b>{v.provider}</b></span>
          {configured ? <Badge tone="green">API key configured</Badge> : <Badge tone="amber">Waiting for GEMINI_API_KEY</Badge>}
        </div>
        {!configured && <div style={{ marginBottom: 12 }}><Notice tone="warning">Add a free Gemini API key (aistudio.google.com) as <code>GEMINI_API_KEY</code> in the backend environment. Until then the voice receptionist stays off.</Notice></div>}
        <Toggle checked={v.enabled} onChange={(x) => set("voice.enabled", x)} label="Show the “📞 Call our AI receptionist” button on the patient booking page" />
        <div style={{ display: "flex", gap: 16, margin: "6px 0 12px" }}>
          <Toggle checked={v.languages.includes("sk")} onChange={() => toggleLang("sk")} label="Slovak" />
          <Toggle checked={v.languages.includes("en")} onChange={() => toggleLang("en")} label="English" />
        </div>
        <Toggle checked={v.can_book} onChange={(x) => set("voice.can_book", x)} label="Can book appointments (checks live free slots)" />
        <Toggle checked={v.can_cancel} onChange={(x) => set("voice.can_cancel", x)} label="Can cancel appointments" />
        <Toggle checked={v.ai_disclosure} onChange={(x) => set("voice.ai_disclosure", x)} label="Tell callers they are speaking to an AI (required under the EU AI Act — keep on)" />
        <Grid cols="1fr 1fr" gap={12}>
          <Field label="Hand over to staff — phone"><Input value={v.handoff_phone} onChange={(e) => set("voice.handoff_phone", e.target.value)} /></Field>
          <Field label="Max call length (minutes)"><Input type="number" value={v.max_call_minutes} onChange={(e) => set("voice.max_call_minutes", Number(e.target.value))} /></Field>
        </Grid>
        <Field label="Greeting — Slovak"><TextArea value={v.greeting_sk} onChange={(e) => set("voice.greeting_sk", e.target.value)} /></Field>
        <Field label="Greeting — English"><TextArea value={v.greeting_en} onChange={(e) => set("voice.greeting_en", e.target.value)} /></Field>
      </Card>
      <Card title="Phone line">
        <div style={{ fontSize: 13, color: C.tx2, lineHeight: 1.6 }}>
          Patients talk to the receptionist from the booking page on any phone or laptop (free). A dedicated phone number (Twilio, ~€1/month + per-minute) can be connected later without changing the receptionist.
        </div>
      </Card>
    </>
  );
}

function BookingSection({ draft, set }) {
  const b = draft.booking;
  const url = `${window.location.origin}/book`;
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: "#0F172A" } }).then(setQr).catch(() => setQr(null));
  }, [url]);
  return (
    <>
      <Card title="Public booking link" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          {qr && <img src={qr} alt="Booking page QR code" width={150} height={150} style={{ border: `1px solid ${C.br}`, borderRadius: 8 }} />}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 13, color: C.tx3, marginBottom: 6 }}>Share this link or print the QR code (reception desk, website, Google Business profile).</div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: C.tx1, background: C.bg, padding: "8px 10px", borderRadius: 6, marginBottom: 10, wordBreak: "break-all" }}>{url}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button small onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied ✓" : "Copy link"}</Button>
              <Button small variant="secondary" onClick={() => window.open(url, "_blank")}>Open booking page ↗</Button>
              {qr && <a href={qr} download="booking-qr.png"><Button small variant="secondary">⬇ Download QR</Button></a>}
            </div>
          </div>
        </div>
      </Card>
      <Card title="Booking rules">
        <Toggle checked={b.enabled} onChange={(x) => set("booking.enabled", x)} label="Online booking enabled" />
        <Toggle checked={b.allow_same_day} onChange={(x) => set("booking.allow_same_day", x)} label="Allow same-day bookings" />
        <Toggle checked={b.show_prices} onChange={(x) => set("booking.show_prices", x)} label="Show prices on the booking page" />
        <Toggle checked={b.require_consent} onChange={(x) => set("booking.require_consent", x)} label="Require GDPR consent checkbox" />
        <Grid cols="1fr 1fr" gap={12}>
          <Field label="Patients can book up to (days ahead)"><Input type="number" value={b.days_ahead} onChange={(e) => set("booking.days_ahead", Number(e.target.value))} /></Field>
          <Field label="Minimum notice (hours)"><Input type="number" value={b.min_notice_hours} onChange={(e) => set("booking.min_notice_hours", Number(e.target.value))} /></Field>
        </Grid>
        <Field label="Consent text — English"><TextArea value={b.consent_text_en} onChange={(e) => set("booking.consent_text_en", e.target.value)} /></Field>
        <Field label="Consent text — Slovak"><TextArea value={b.consent_text_sk} onChange={(e) => set("booking.consent_text_sk", e.target.value)} /></Field>
        <div style={{ fontSize: 12, color: C.tx3 }}>Which treatments can be booked online is set in <b>Treatments &amp; pricing</b>.</div>
      </Card>
    </>
  );
}

function NotificationsSection({ draft, set }) {
  const n = draft.notifications;
  return (
    <Card title="Notifications">
      <Toggle checked={n.low_stock_alert} onChange={(x) => set("notifications.low_stock_alert", x)} label="Alert when stock falls below minimum" />
      <Toggle checked={n.overdue_lab_alert} onChange={(x) => set("notifications.overdue_lab_alert", x)} label="Alert when a lab order is overdue" />
      <Toggle checked={n.daily_summary_email} onChange={(x) => set("notifications.daily_summary_email", x)} label="Daily summary email (planned — needs an email provider)" />
      <Grid cols="1fr 1fr" gap={12}>
        <Field label="Flag unpaid invoices as overdue after (days)"><Input type="number" value={n.overdue_invoice_days} onChange={(e) => set("notifications.overdue_invoice_days", Number(e.target.value))} /></Field>
        <Field label="Summary email recipient"><Input value={n.summary_email} onChange={(e) => set("notifications.summary_email", e.target.value)} /></Field>
      </Grid>
    </Card>
  );
}

function PrivacySection({ draft, set }) {
  const p = draft.privacy;
  return (
    <Card title="Privacy & GDPR">
      <Grid cols="1fr 1fr" gap={12}>
        <Field label="Data region"><Select value={p.data_region} onChange={(e) => set("privacy.data_region", e.target.value)} options={["EU"]} /></Field>
        <Field label="Keep patient records for (years)" hint="Check the required retention period with your legal advisor"><Input type="number" value={p.retention_years} onChange={(e) => set("privacy.retention_years", Number(e.target.value))} /></Field>
        <Field label="Data protection contact (DPO) email"><Input value={p.dpo_email} onChange={(e) => set("privacy.dpo_email", e.target.value)} /></Field>
      </Grid>
      <Toggle checked={p.record_calls} onChange={(x) => set("privacy.record_calls", x)} label="Record voice receptionist calls (off by default — requires caller consent)" />
      <div style={{ marginTop: 8 }}>
        <Notice tone="warning">Patient names, phone numbers and treatments are health-related personal data. Before going live with real patients: sign data processing agreements with every provider (Google, hosting, AI), use paid AI tiers that do not train on your data, and publish a privacy notice on the booking page.</Notice>
      </div>
    </Card>
  );
}

function SystemSection() {
  const { data, error, loading, reload } = useApi("/api/system/status");
  const [regen, setRegen] = useState(false);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const i = data.integrations;
  const row = (name, ok, detail, extra) => ({ name, ok, detail, extra });
  const rows = [
    row("Google Calendar", i.google_calendar.configured, `Calendar: ${i.google_calendar.calendar_id} · auth: ${i.google_calendar.auth_mode}`),
    row("AI no-show model", data.model.loaded, data.model.loaded ? `v${data.model.meta.version} · AUC ${data.model.meta.metrics.roc_auc}` : data.model.error),
    row("Gemini voice receptionist", i.gemini_voice.configured, i.gemini_voice.configured ? "API key present" : "Add GEMINI_API_KEY to the backend environment"),
    row("WhatsApp reminders", i.whatsapp.configured, "Click-to-chat (free, staff sends with one click)"),
    row("Database", i.database.configured, `Demo data in memory · planned: ${i.database.planned}`),
  ];
  const regenerate = async () => {
    if (!window.confirm("Regenerate all demo clinic data? Changes made in the demo (new patients, invoices, orders) will be lost.")) return;
    setRegen(true);
    await api("/api/demo/regenerate", { method: "POST" });
    setRegen(false);
    reload();
  };
  return (
    <>
      <Card title="Integrations" style={{ marginBottom: 16 }}>
        <Table rows={rows} columns={[
          { label: "Service", render: (r) => <b style={{ color: C.tx1 }}>{r.name}</b> },
          { label: "Status", render: (r) => <Badge tone={r.ok ? "green" : "amber"}>{r.ok ? "Connected" : "Not configured"}</Badge> },
          { label: "Details", wrap: true, render: (r) => <span style={{ fontSize: 12 }}>{r.detail}</span> },
        ]} />
      </Card>
      <Card title="System">
        <div style={{ fontSize: 13, color: C.tx2, lineHeight: 1.9 }}>
          <div><b>API:</b> {data.api} · clinic time {data.clinic_time.replace("T", " ")}</div>
          <div><b>Data mode:</b> <Badge tone="violet">Demo clinic</Badge> generated {data.data_generated_at.replace("T", " ")}</div>
          <div><b>Records:</b> {Object.entries(data.counts).map(([k, v]) => `${v.toLocaleString()} ${k.replace("_", " ")}`).join(" · ")}</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button variant="secondary" onClick={reload}>Refresh status</Button>
          <Button variant="danger" onClick={regenerate} disabled={regen}>{regen ? "Regenerating…" : "Regenerate demo data"}</Button>
        </div>
        <div style={{ fontSize: 12, color: C.tx3, marginTop: 12 }}>Tip: a free uptime monitor (e.g. UptimeRobot) pinging the API every 5 minutes keeps the free Render server awake for demos.</div>
      </Card>
    </>
  );
}
