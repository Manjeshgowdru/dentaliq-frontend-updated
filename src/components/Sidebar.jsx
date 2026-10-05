import { useSettings } from "../SettingsContext";

const menuItems = [
  { icon: "🏠", label: "Dashboard",              path: "dashboard" },
  { icon: "📅", label: "Appointments",           path: "appointments" },
  { icon: "🦷", label: "Patients",               path: "patients" },
  { icon: "🤖", label: "AI Predictions",         path: "predictions" },
  { icon: "📊", label: "Financial Intelligence", path: "financial" },
  { icon: "📈", label: "Stock Manager",          path: "stock" },
  { icon: "🪑", label: "Equipment Scheduler",    path: "equipment" },
  { icon: "📋", label: "Treatment & Plans",      path: "treatment" },
  { icon: "💳", label: "Billing & Invoices",     path: "billing" },
  { icon: "📉", label: "Reports",                path: "reports" },
  { icon: "🧪", label: "Lab Orders",             path: "lab" },
  { icon: "🛒", label: "Procurement",            path: "procurement" },
  { icon: "⚙️", label: "Settings",              path: "settings" },
];

const FULL_WIDTH = 220;
const RAIL_WIDTH = 68;

// collapsed: desktop icon-only rail. mobile: off-canvas drawer shown when `open`.
export default function Sidebar({ active, setActive, collapsed = false, mobile = false, open = false, onClose = () => {}, onToggle }) {
  const { settings } = useSettings();
  const clinic = settings?.clinic;
  const rail = collapsed && !mobile;
  const width = rail ? RAIL_WIDTH : FULL_WIDTH;
  const initials = (clinic?.name || "Smiles Dental Clinic").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const panel = (
    <div
      style={{
        width, flexShrink: 0, height: "100vh", background: "#0F172A", display: "flex", flexDirection: "column",
        transition: "width .18s ease, transform .2s ease", overflow: "hidden",
        ...(mobile ? { position: "fixed", top: 0, left: 0, zIndex: 1001, transform: open ? "translateX(0)" : `translateX(-${FULL_WIDTH + 10}px)`, boxShadow: open ? "8px 0 24px rgba(0,0,0,.25)" : "none" } : {}),
      }}
    >
      {/* Logo */}
      <div style={{ padding: rail ? "20px 0 16px" : "20px 16px 16px", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: rail ? "center" : "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#4F5BD5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🦷</div>
          {!rail && (
            <div style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>DentalIQ</div>
              <div style={{ fontSize: 10, color: "#475569" }}>AI Revenue Intelligence</div>
            </div>
          )}
        </div>
        {mobile && (
          <button onClick={onClose} aria-label="Close menu" style={{ background: "transparent", border: "none", color: "#94A3B8", fontSize: 18, cursor: "pointer" }}>✕</button>
        )}
      </div>

      {/* Clinic selector */}
      <div style={{ padding: rail ? "12px 0" : "12px 16px", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "center" }}>
        {rail ? (
          <div title={clinic?.name} style={{ width: 36, height: 36, borderRadius: 8, background: "#1E293B", color: "#CBD5E1", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials}</div>
        ) : (
          <div style={{ background: "#1E293B", borderRadius: 8, padding: "8px 12px", cursor: "pointer", width: "100%", whiteSpace: "nowrap", overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis" }}>{clinic?.name || "Smiles Dental Clinic"}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{clinic?.address?.split(",").slice(-2).join(",").trim() || "Košice, Slovakia"}</div>
          </div>
        )}
      </div>

      {/* Menu items */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "8px 0" }}>
        {menuItems.map(item => {
          const on = active === item.path;
          return (
            <div key={item.path} onClick={() => { setActive(item.path); if (mobile) onClose(); }} title={rail ? item.label : undefined}
              style={{ display: "flex", alignItems: "center", justifyContent: rail ? "center" : "flex-start", gap: 10, padding: rail ? "11px 0" : "10px 16px", cursor: "pointer", background: on ? "#1E293B" : "transparent", borderLeft: `3px solid ${on ? "#4F5BD5" : "transparent"}`, color: on ? "#fff" : "#64748B", fontSize: 13, fontWeight: on ? 600 : 400, transition: "background .15s", marginBottom: 1, whiteSpace: "nowrap", position: "relative" }}>
              <span style={{ fontSize: rail ? 17 : 15 }}>{item.icon}</span>
              {!rail && <span>{item.label}</span>}
              {item.path === "predictions" && !rail && (
                <span style={{ marginLeft: "auto", background: "#4F5BD5", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "2px 6px" }}>AI</span>
              )}
              {item.path === "predictions" && rail && (
                <span style={{ position: "absolute", top: 7, right: 14, width: 7, height: 7, borderRadius: "50%", background: "#4F5BD5" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Collapse control (desktop) */}
      {!mobile && onToggle && (
        <div onClick={onToggle} title={rail ? "Expand menu" : "Collapse menu"} style={{ padding: rail ? "8px 0" : "8px 16px", borderTop: "1px solid #1E293B", color: "#64748B", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: rail ? "center" : "flex-start", gap: 8, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 14 }}>{rail ? "»" : "«"}</span>{!rail && "Collapse menu"}
        </div>
      )}

      {/* User profile */}
      <div title={rail ? "Manjesh Gowda · Admin" : undefined} style={{ padding: rail ? "12px 0" : "12px 16px", borderTop: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: rail ? "center" : "flex-start", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4F5BD5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>MG</div>
        {!rail && (
          <div style={{ whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#CBD5E1" }}>Manjesh Gowda</div>
            <div style={{ fontSize: 10, color: "#475569" }}>Admin</div>
          </div>
        )}
      </div>
    </div>
  );

  if (!mobile) return panel;
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 1000 }} />}
      {panel}
    </>
  );
}
