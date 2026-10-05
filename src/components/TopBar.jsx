import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useSettings } from "../SettingsContext";
import RiskBadge from "./RiskBadge";

const C = { tx1: "#0F172A", tx2: "#334155", tx3: "#64748B", tx4: "#94A3B8", br: "#E2E8F0", br2: "#F1F5F9", ind: "#4F5BD5", red: "#DC2626", grn: "#059669" };

const PAGE_TITLE = {
  dashboard: "Dashboard", appointments: "Appointments", patients: "Patients", predictions: "AI Predictions",
  financial: "Financial Intelligence", stock: "Stock Manager", equipment: "Equipment Scheduler", treatment: "Treatment & Plans",
  billing: "Billing & Invoices", reports: "Reports", lab: "Lab Orders", procurement: "Procurement", settings: "Settings",
};

const SEEN_KEY = "dentaliq.seenNotifications";
const readSeen = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
};
const writeSeen = (set) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...set].slice(-300)));
  } catch {
    /* storage unavailable */
  }
};

const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function TopBar({ page, onToggleMenu, menuOpen = true, onNavigate = () => {}, compact = false }) {
  const [open, setOpen] = useState(null); // "search" | "messages" | "bell" | "calendar" | "help" | "profile"
  const barRef = useRef(null);
  const searchRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [seen, setSeen] = useState(readSeen);
  const [pending, setPending] = useState({ items: [], total: 0 });

  const loadAlerts = useCallback(async () => {
    try {
      const [n, r] = await Promise.all([api("/api/notifications"), api("/api/reminders/pending")]);
      setNotes(n.items);
      setPending(r);
    } catch {
      /* offline: keep the last state */
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const t = setInterval(loadAlerts, 60000);
    return () => clearInterval(t);
  }, [loadAlerts]);

  // Close menus on outside click / Esc; "/" focuses search
  useEffect(() => {
    const onDown = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (target, params) => {
    setOpen(null);
    onNavigate(target, params);
  };
  const toggle = (name) => {
    setOpen((o) => (o === name ? null : name));
    if (name === "bell" || name === "messages") loadAlerts();
  };

  const unread = notes.filter((n) => !seen.has(n.id)).length;
  const markAllRead = () => {
    const next = new Set([...seen, ...notes.map((n) => n.id)]);
    setSeen(next);
    writeSeen(next);
  };
  const openNote = (n) => {
    const next = new Set([...seen, n.id]);
    setSeen(next);
    writeSeen(next);
    go(n.page, n.params);
  };

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div ref={barRef} style={{ height: 60, background: "#fff", borderBottom: `1px solid ${C.br}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: compact ? "0 12px" : "0 24px", flexShrink: 0, position: "relative", zIndex: 50, gap: 12 }}>

      {/* Left — menu toggle + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <button onClick={onToggleMenu} title={menuOpen ? "Hide menu" : "Show menu"} aria-label="Toggle menu" style={{ fontSize: 20, cursor: "pointer", color: C.tx3, background: "transparent", border: "none", padding: "4px 6px", borderRadius: 6, lineHeight: 1 }}>☰</button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.tx1, whiteSpace: "nowrap" }}>{PAGE_TITLE[page] || "DentalIQ"}</div>
          {!compact && (
            <div style={{ fontSize: 10, color: C.tx4, display: "flex", gap: 6, alignItems: "center" }}>
              {page === "dashboard" ? "Executive Overview" : "DentalIQ"}
              <span title="Running on generated demo clinic data" style={{ background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE", borderRadius: 4, padding: "0 5px", fontSize: 9, fontWeight: 700 }}>DEMO DATA</span>
            </div>
          )}
        </div>
      </div>

      {/* Center — global search */}
      {!compact && <GlobalSearch inputRef={searchRef} open={open === "search"} setOpen={(v) => setOpen(v ? "search" : null)} onPick={(r) => go(r.page, r.params)} />}

      {/* Right — icons */}
      <div style={{ display: "flex", alignItems: "center", gap: compact ? 4 : 10 }}>
        {compact && <IconButton icon="🔍" label="Search" active={open === "search"} onClick={() => toggle("search")} />}

        <div style={{ position: "relative" }}>
          <IconButton icon="💬" label="Patient reminders to send" active={open === "messages"} onClick={() => toggle("messages")} badge={pending.total} badgeColor={C.ind} />
          {open === "messages" && <MessagesPanel pending={pending} reload={loadAlerts} onOpenAll={() => go("predictions")} />}
        </div>

        <div style={{ position: "relative" }}>
          <IconButton icon="🔔" label="Notifications" active={open === "bell"} onClick={() => toggle("bell")} badge={unread} />
          {open === "bell" && (
            <Panel title="Notifications" width={380} action={notes.length > 0 && unread > 0 && <TextButton onClick={markAllRead}>Mark all as read</TextButton>}>
              {notes.length === 0 && <Empty text="All clear — nothing needs your attention." />}
              {notes.map((n) => {
                const isNew = !seen.has(n.id);
                return (
                  <div key={n.id} onClick={() => openNote(n)} style={{ display: "flex", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${C.br2}`, background: isNew ? "#F5F7FF" : "#fff" }}>
                    <span style={{ fontSize: 18 }}>{n.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: isNew ? 700 : 500, color: C.tx1 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: C.tx3, marginTop: 2 }}>{n.detail}</div>
                    </div>
                    {isNew && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.ind, marginTop: 6, flexShrink: 0 }} />}
                  </div>
                );
              })}
            </Panel>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <IconButton icon="📅" label="Calendar" active={open === "calendar"} onClick={() => toggle("calendar")} />
          {open === "calendar" && <CalendarPanel onPick={(d) => go("appointments", { date: d })} />}
        </div>

        {!compact && (
          <div style={{ position: "relative" }}>
            <IconButton icon="❓" label="Help" active={open === "help"} onClick={() => toggle("help")} />
            {open === "help" && <HelpPanel go={go} />}
          </div>
        )}

        {!compact && <div style={{ width: 1, height: 24, background: C.br, margin: "0 4px" }} />}
        {!compact && <div style={{ fontSize: 12, color: C.tx3, fontFamily: "monospace", whiteSpace: "nowrap" }}>{today}</div>}

        <div style={{ position: "relative" }}>
          <button onClick={() => toggle("profile")} title="Account" aria-label="Account menu" style={{ width: 32, height: 32, borderRadius: "50%", background: C.ind, border: open === "profile" ? "2px solid #C7CCF5" : "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", marginLeft: 6 }}>MG</button>
          {open === "profile" && <ProfilePanel go={go} />}
        </div>
      </div>

      {compact && open === "search" && (
        <div style={{ position: "absolute", top: 60, left: 0, right: 0, background: "#fff", padding: 12, borderBottom: `1px solid ${C.br}` }}>
          <GlobalSearch inputRef={searchRef} open setOpen={() => {}} onPick={(r) => go(r.page, r.params)} autoFocus full />
        </div>
      )}
    </div>
  );
}

// ---------- building blocks ----------
function IconButton({ icon, label, onClick, active, badge = 0, badgeColor = C.red }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} style={{ position: "relative", background: active ? "#EEF0FF" : "transparent", border: "none", borderRadius: 8, width: 36, height: 36, fontSize: 19, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {icon}
      {badge > 0 && (
        <span style={{ position: "absolute", top: 1, right: 0, background: badgeColor, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 8, minWidth: 15, height: 15, padding: "0 3px", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function Panel({ title, action, children, width = 340, footer }) {
  return (
    <div style={{ position: "absolute", top: 44, right: 0, width, maxWidth: "calc(100vw - 24px)", background: "#fff", border: `1px solid ${C.br}`, borderRadius: 12, boxShadow: "0 16px 32px rgba(15,23,42,.14)", overflow: "hidden", zIndex: 60 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: `1px solid ${C.br}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.tx1 }}>{title}</div>
        {action}
      </div>
      <div style={{ maxHeight: 420, overflowY: "auto" }}>{children}</div>
      {footer && <div style={{ borderTop: `1px solid ${C.br}`, padding: "10px 14px" }}>{footer}</div>}
    </div>
  );
}

function TextButton({ children, onClick }) {
  return <button onClick={onClick} style={{ background: "transparent", border: "none", color: C.ind, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>{children}</button>;
}

function Empty({ text }) {
  return <div style={{ padding: "24px 14px", textAlign: "center", color: C.tx4, fontSize: 13 }}>{text}</div>;
}

function MenuItem({ icon, label, hint, onClick, disabled }) {
  return (
    <div onClick={disabled ? undefined : onClick} title={hint} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", fontSize: 13, color: disabled ? C.tx4 : C.tx2, cursor: disabled ? "not-allowed" : "pointer", borderBottom: `1px solid ${C.br2}` }}>
      <span style={{ width: 20, textAlign: "center" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {hint && <span style={{ fontSize: 11, color: C.tx4 }}>{hint}</span>}
    </div>
  );
}

// ---------- search ----------
function GlobalSearch({ inputRef, open, setOpen, onPick, autoFocus, full }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const r = await api(`/api/search?q=${encodeURIComponent(q.trim())}`);
        setResults(r.results);
        setIdx(0);
      } catch {
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (r) => {
    setQ("");
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
    onPick(r);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[idx]) pick(results[idx]);
  };

  let lastType = null;
  return (
    <div style={{ flex: 1, maxWidth: full ? "none" : 420, position: "relative" }}>
      <div style={{ background: "#F8FAFC", border: `1px solid ${open ? "#C7CCF5" : C.br}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.tx4, fontSize: 14 }}>🔍</span>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search patients, invoices, plans, lab orders, stock…"
          style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#475569", width: "100%", fontFamily: "inherit" }}
        />
        {!full && <span style={{ fontSize: 10, color: C.tx4, border: `1px solid ${C.br}`, borderRadius: 4, padding: "1px 5px" }}>/</span>}
      </div>
      {open && q.trim().length >= 2 && (
        <div style={{ position: "absolute", top: 42, left: 0, right: 0, background: "#fff", border: `1px solid ${C.br}`, borderRadius: 10, boxShadow: "0 16px 32px rgba(15,23,42,.14)", maxHeight: 420, overflowY: "auto", zIndex: 60 }}>
          {busy && results.length === 0 && <Empty text="Searching…" />}
          {!busy && results.length === 0 && <Empty text={`No matches for “${q.trim()}”`} />}
          {results.map((r, i) => {
            const header = r.type !== lastType;
            lastType = r.type;
            return (
              <div key={r.type + r.id}>
                {header && <div style={{ fontSize: 10, fontWeight: 700, color: C.tx4, textTransform: "uppercase", letterSpacing: ".8px", padding: "8px 14px 4px" }}>{r.type}s</div>}
                <div onMouseEnter={() => setIdx(i)} onMouseDown={(e) => { e.preventDefault(); pick(r); }} style={{ padding: "8px 14px", cursor: "pointer", background: i === idx ? "#EEF0FF" : "#fff" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.tx1 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: C.tx3 }}>{r.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- reminders (💬) ----------
function MessagesPanel({ pending, reload, onOpenAll }) {
  const { settings } = useSettings();
  const send = async (a) => {
    const tpl = settings?.reminders?.template_sk || "Dobrý deň {name}, pripomíname Vám termín v {clinic} dňa {date} o {time}.";
    const text = tpl.replace("{name}", a.patient).replace("{clinic}", settings?.clinic?.name || "").replace("{date}", a.date).replace("{time}", a.time);
    try {
      await api(`/api/appointments/${a.id}/reminder`, { method: "POST" });
    } catch {
      /* still open the message */
    }
    if (a.risk_level === "moderate") window.location.href = `sms:${a.phone}?body=${encodeURIComponent(text)}`;
    else window.open(`https://wa.me/${(a.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
    reload();
  };
  return (
    <Panel title={`Reminders to send · next 2 days (${pending.total})`} width={420} footer={<TextButton onClick={onOpenAll}>Open AI Predictions →</TextButton>}>
      {pending.items.length === 0 && <Empty text="Everyone at risk has been reminded ✓" />}
      {pending.items.map((a) => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.br2}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.tx1 }}>{a.patient}</div>
            <div style={{ fontSize: 11, color: C.tx3 }}>{a.date.slice(5)} {a.time} · {a.treatment_name}</div>
          </div>
          <RiskBadge prob={a.prob} />
          <button onClick={() => send(a)} style={{ background: a.risk_level === "moderate" ? "#F8FAFC" : "#ECFDF5", color: a.risk_level === "moderate" ? C.tx2 : C.grn, border: `1px solid ${a.risk_level === "moderate" ? C.br : "#A7F3D0"}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {a.risk_level === "moderate" ? "💬 SMS" : "📲 WhatsApp"}
          </button>
        </div>
      ))}
    </Panel>
  );
}

// ---------- calendar (📅) ----------
function CalendarPanel({ onPick }) {
  const { settings } = useSettings();
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [today, setToday] = useState({ loading: true, events: [] });

  useEffect(() => {
    api(`/api/calendar/events?date=${isoDay(now)}`)
      .then((r) => setToday({ loading: false, events: r.events || [] }))
      .catch(() => setToday({ loading: false, events: [], error: true }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const closed = (d) => settings?.hours?.[keys[d.getDay()]]?.closed;
  const first = (month.getDay() + 6) % 7; // Monday-first grid
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const todayIso = isoDay(now);

  return (
    <Panel title="Calendar" width={340} footer={<TextButton onClick={() => onPick(todayIso)}>Open today's appointments →</TextButton>}>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <TextButton onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</TextButton>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.tx1 }}>{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
          <TextButton onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</TextButton>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <div key={d} style={{ fontSize: 10, color: C.tx4, fontWeight: 700, padding: "4px 0" }}>{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const iso = isoDay(d);
            const isToday = iso === todayIso;
            const off = closed(d);
            return (
              <div key={iso} onClick={() => onPick(iso)} title={off ? "Clinic closed" : "Open appointments for this day"} style={{ fontSize: 12, padding: "6px 0", borderRadius: 6, cursor: "pointer", background: isToday ? C.ind : "transparent", color: isToday ? "#fff" : off ? "#CBD5E1" : C.tx2, fontWeight: isToday ? 700 : 500 }}>
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.br}`, padding: "10px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.tx4, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Today in Google Calendar</div>
        {today.loading && <div style={{ fontSize: 12, color: C.tx4 }}>Loading…</div>}
        {today.error && <div style={{ fontSize: 12, color: C.tx4 }}>Calendar not reachable right now.</div>}
        {!today.loading && !today.error && today.events.length === 0 && <div style={{ fontSize: 12, color: C.tx4 }}>No bookings today.</div>}
        {today.events.slice(0, 6).map((e) => (
          <div key={e.id} style={{ display: "flex", gap: 10, fontSize: 12, padding: "4px 0", color: C.tx2 }}>
            <span style={{ fontFamily: "monospace", color: C.tx3 }}>{e.time}</span>
            <span style={{ fontWeight: 600 }}>{e.name}</span>
            <span style={{ color: C.tx4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.proc}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------- help (❓) ----------
function HelpPanel({ go }) {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    api("/api/system/status").then(setStatus).catch(() => setStatus({ api: "offline" }));
  }, []);
  const dot = (ok) => <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: ok ? C.grn : "#F59E0B", marginRight: 6 }} />;
  return (
    <Panel title="Help & shortcuts" width={330}>
      <MenuItem icon="🔍" label="Search anything" hint="press /" onClick={() => document.querySelector('input[placeholder^="Search patients"]')?.focus()} />
      <MenuItem icon="☰" label="Hide or show the menu" hint="☰ button" onClick={() => {}} />
      <MenuItem icon="🌐" label="Open patient booking page" onClick={() => go("book")} />
      <MenuItem icon="🎙️" label="Test the AI voice receptionist" hint="Settings" onClick={() => go("settings")} />
      <MenuItem icon="🤖" label="How the AI risk score works" onClick={() => go("predictions")} />
      <div style={{ padding: "10px 14px", fontSize: 12, color: C.tx2, lineHeight: 1.8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.tx4, textTransform: "uppercase", letterSpacing: ".8px" }}>System status</div>
        {!status && <div style={{ color: C.tx4 }}>Checking…</div>}
        {status && (
          <>
            <div>{dot(status.api === "online")}API {status.api}</div>
            <div>{dot(status.model?.loaded)}AI model {status.model?.loaded ? `v${status.model.meta?.version}` : "not loaded"}</div>
            <div>{dot(status.integrations?.google_calendar?.configured)}Google Calendar {status.integrations?.google_calendar?.configured ? "connected" : "not set up"}</div>
            <div>{dot(status.integrations?.gemini_voice?.configured)}Voice receptionist {status.integrations?.gemini_voice?.configured ? "ready" : "needs API key"}</div>
          </>
        )}
      </div>
    </Panel>
  );
}

// ---------- profile ----------
function ProfilePanel({ go }) {
  return (
    <Panel title="Manjesh Gowda · Admin" width={260}>
      <MenuItem icon="⚙️" label="Clinic settings" onClick={() => go("settings")} />
      <MenuItem icon="👥" label="Team & roles" onClick={() => go("settings")} />
      <MenuItem icon="🌐" label="Patient booking page" onClick={() => go("book")} />
      <MenuItem icon="🚪" label="Log out" hint="with staff login" disabled />
    </Panel>
  );
}
