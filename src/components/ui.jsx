// Shared UI building blocks for the clinic portal (matches the existing inline-style look).

export const C = {
  ind: "#4F5BD5", tea: "#0891B2", grn: "#059669", amb: "#B45309", red: "#DC2626", vio: "#7C3AED",
  tx1: "#0F172A", tx2: "#334155", tx3: "#64748B", tx4: "#94A3B8",
  br: "#E2E8F0", br2: "#F1F5F9", bg: "#F8FAFC",
};

export const CHART_COLORS = ["#4F5BD5", "#0891B2", "#059669", "#7C3AED", "#B45309", "#DC2626", "#64748B", "#DB2777"];

export const eur = (v, digits = 0) =>
  `€${Number(v || 0).toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const pct = (v, digits = 0) => `${Number(v || 0).toFixed(digits)}%`;

export const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function Page({ children }) {
  return <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.tx1 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.tx3, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, style, pad = 16 }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.br}`, borderRadius: 10, padding: pad, minWidth: 0, ...style }}>
      {(title || actions) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
          {title && <div style={{ fontSize: 12, fontWeight: 700, color: C.tx1, textTransform: "uppercase", letterSpacing: "1px" }}>{title}</div>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Grid({ cols = "repeat(4, 1fr)", gap = 12, children, min }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: min ? `repeat(auto-fit, minmax(${min}px, 1fr))` : cols, gap }}>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, color = C.ind, icon }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.br}`, borderRadius: 10, borderTop: `3px solid ${color}`, padding: "14px 16px", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 11, color: C.tx3, marginTop: 4, textTransform: "uppercase", letterSpacing: ".6px" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: C.tx4, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const BADGE_TONES = {
  green: ["#ECFDF5", "#059669"], red: ["#FEF2F2", "#DC2626"], amber: ["#FFFBEB", "#B45309"], blue: ["#EFF6FF", "#2563EB"],
  indigo: ["#EEF0FF", "#4F5BD5"], teal: ["#ECFEFF", "#0891B2"], gray: ["#F1F5F9", "#64748B"], violet: ["#F5F3FF", "#7C3AED"],
};

export const STATUS_TONE = {
  Paid: "green", Completed: "green", Fitted: "green", Received: "green", Operational: "green", OK: "green", Accepted: "teal",
  Unpaid: "amber", Proposed: "indigo", "In progress": "blue", Sent: "blue", Ordered: "blue", "In production": "violet", Shipped: "teal",
  Draft: "gray", Upcoming: "blue", Cancelled: "gray", Declined: "gray",
  Overdue: "red", "No-show": "red", Remake: "red", "Out of stock": "red", "Out of service": "red", Low: "amber", Maintenance: "amber", "Due soon": "amber",
  critical: "red", high: "amber", moderate: "amber", low: "green",
};

export function Badge({ children, tone }) {
  const [bg, fg] = BADGE_TONES[tone || STATUS_TONE[children] || "gray"];
  return (
    <span style={{ background: bg, color: fg, border: `1px solid ${fg}33`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", display: "inline-block" }}>
      {children}
    </span>
  );
}

export function Button({ children, onClick, variant = "primary", small, disabled, type = "button", title }) {
  const styles = {
    primary: { background: C.ind, color: "#fff", border: "none" },
    secondary: { background: "#fff", color: C.tx2, border: `1px solid ${C.br}` },
    ghost: { background: "transparent", color: C.ind, border: "none" },
    danger: { background: "#FEF2F2", color: C.red, border: "1px solid #FECACA" },
    success: { background: "#ECFDF5", color: C.grn, border: "1px solid #A7F3D0" },
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...styles, borderRadius: small ? 6 : 8, padding: small ? "5px 10px" : "8px 14px", fontSize: small ? 11 : 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, whiteSpace: "nowrap", fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

export function Table({ columns, rows, empty = "Nothing to show yet.", onRowClick, maxHeight }) {
  return (
    <div style={{ overflowX: "auto", maxHeight, overflowY: maxHeight ? "auto" : undefined }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key || c.label} style={{ padding: "10px 12px", textAlign: c.align || "left", fontSize: 11, color: C.tx3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".8px", borderBottom: `1px solid ${C.br}`, background: C.bg, position: maxHeight ? "sticky" : undefined, top: 0, whiteSpace: "nowrap" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: "28px 12px", textAlign: "center", color: C.tx4, fontSize: 13 }}>{empty}</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id || i} onClick={onRowClick ? () => onRowClick(r) : undefined} style={{ borderBottom: `1px solid ${C.br2}`, cursor: onRowClick ? "pointer" : undefined, background: i % 2 ? "#FAFBFF" : "#fff" }}>
                {columns.map((c) => (
                  <td key={c.key || c.label} style={{ padding: "10px 12px", fontSize: 13, color: C.tx2, textAlign: c.align || "left", verticalAlign: "middle", whiteSpace: c.wrap ? "normal" : "nowrap" }}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", borderRadius: 12, border: `1px solid ${C.br}`, padding: 22, boxShadow: "0 20px 25px -5px rgba(0,0,0,.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.tx1 }}>{title}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 18, color: C.tx4, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, fontFamily: "inherit", color: C.tx2, background: "#fff", boxSizing: "border-box" };

export function Field({ label, hint, children }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.tx3, textTransform: "uppercase", marginBottom: 4, letterSpacing: ".4px" }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: C.tx4, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

export function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function TextArea(props) {
  return <textarea rows={3} {...props} style={{ ...inputStyle, resize: "vertical", ...props.style }} />;
}

export function Select({ options, ...props }) {
  return (
    <select {...props} style={{ ...inputStyle, ...props.style }}>
      {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: C.tx2, marginBottom: 10 }}>
      <span onClick={() => onChange(!checked)} style={{ width: 36, height: 20, borderRadius: 10, background: checked ? C.ind : "#CBD5E1", position: "relative", transition: "background .15s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
      </span>
      <span onClick={() => onChange(!checked)}>{label}</span>
    </label>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.br}`, flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const key = t.key || t;
        const on = key === active;
        return (
          <button key={key} onClick={() => onChange(key)} style={{ background: "transparent", border: "none", borderBottom: `2px solid ${on ? C.ind : "transparent"}`, color: on ? C.ind : C.tx3, fontWeight: on ? 700 : 500, padding: "8px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: -1 }}>
            {t.label || t}{t.count !== undefined ? ` (${t.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}

export function Progress({ value, color = C.ind, height = 6 }) {
  return (
    <div style={{ height, background: C.br2, borderRadius: height, overflow: "hidden", minWidth: 60 }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value || 0))}%`, height: "100%", background: color, borderRadius: height }} />
    </div>
  );
}

export function Loading({ text = "Loading clinic data…" }) {
  return <div style={{ padding: 40, textAlign: "center", color: C.tx3, fontSize: 13 }}>⏳ {text}</div>;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div style={{ margin: 24, padding: 20, borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", fontSize: 13 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Could not load data</div>
      <div style={{ marginBottom: 12 }}>{error}</div>
      {onRetry && <Button variant="danger" small onClick={onRetry}>Retry</Button>}
    </div>
  );
}

export function Notice({ tone = "info", children }) {
  const t = { info: ["#EEF0FF", "#3A46B8", "#C7CCF5"], success: ["#ECFDF5", "#065F46", "#A7F3D0"], warning: ["#FFFBEB", "#92400E", "#FDE68A"], error: ["#FEF2F2", "#991B1B", "#FECACA"] }[tone];
  return <div style={{ background: t[0], color: t[1], border: `1px solid ${t[2]}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, lineHeight: 1.5 }}>{children}</div>;
}

export function Insights({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ background: "linear-gradient(135deg,#4F5BD5,#7C3AED)", borderRadius: 10, padding: 16, color: "#fff" }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>🤖 AI insights</div>
      {items.map((t, i) => (
        <div key={i} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>• {t}</div>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search…" }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={`🔍 ${placeholder}`} style={{ width: 240 }} />;
}

export function downloadCsv(filename, rows, columns) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [columns.map((c) => esc(c.label)).join(",")].concat(rows.map((r) => columns.map((c) => esc(c.value ? c.value(r) : r[c.key])).join(",")));
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
