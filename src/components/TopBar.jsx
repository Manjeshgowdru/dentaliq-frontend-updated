export default function TopBar({ page }) {
  const now = new Date();
  const time = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const pageTitle = {
    dashboard:    "Dashboard",
    appointments: "Appointments",
    patients:     "Patients",
    predictions:  "AI Predictions",
    financial:    "Financial Intelligence",
    stock:        "Stock Manager",
    equipment:    "Equipment Scheduler",
    treatment:    "Treatment & Plans",
    billing:      "Billing & Invoices",
    reports:      "Reports",
    marketing:    "Marketing & Communication",
    reviews:      "Reviews & Feedback",
    lab:          "Lab Orders",
    procurement:  "Procurement",
    settings:     "Settings",
  };

  return (
    <div style={{ height: 60, background: "#fff", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>

      {/* Left — hamburger + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 20, cursor: "pointer", color: "#64748B" }}>☰</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{pageTitle[page] || "DentalIQ"}</div>
          <div style={{ fontSize: 10, color: "#94A3B8" }}>Executive Overview</div>
        </div>
      </div>

      {/* Center — Search bar */}
      <div style={{ flex: 1, maxWidth: 400, margin: "0 32px" }}>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#94A3B8", fontSize: 14 }}>🔍</span>
          <input placeholder="Search patients, appointments, invoices..."
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#475569", width: "100%" }} />
        </div>
      </div>

      {/* Right — icons + date + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontSize: 20, cursor: "pointer" }}>💬</span>
        <div style={{ position: "relative", cursor: "pointer" }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <span style={{ position: "absolute", top: -4, right: -4, background: "#DC2626", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>4</span>
        </div>
        <span style={{ fontSize: 20, cursor: "pointer" }}>📅</span>
        <span style={{ fontSize: 20, cursor: "pointer" }}>❓</span>
        <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />
        <div style={{ fontSize: 12, color: "#64748B", fontFamily: "monospace" }}>{time}</div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4F5BD5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>M</div>
      </div>
    </div>
  );
}