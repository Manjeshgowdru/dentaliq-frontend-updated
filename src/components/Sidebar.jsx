import { useState } from "react";

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
  { icon: "📣", label: "Marketing & Communication", path: "marketing" },
  { icon: "⭐", label: "Reviews & Feedback",     path: "reviews" },
  { icon: "🧪", label: "Lab Orders",             path: "lab" },
  { icon: "🛒", label: "Procurement",            path: "procurement" },
  { icon: "⚙️", label: "Settings",              path: "settings" },
];

export default function Sidebar({ active, setActive }) {
  return (
    <div style={{ width: 220, minHeight: "100vh", background: "#0F172A", display: "flex", flexDirection: "column", overflowY: "auto" }}>

      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1E293B" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#4F5BD5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🦷</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>DentalIQ</div>
            <div style={{ fontSize: 10, color: "#475569" }}>AI Revenue Intelligence</div>
          </div>
        </div>
      </div>

      {/* Clinic selector */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E293B" }}>
        <div style={{ background: "#1E293B", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#CBD5E1" }}>Smiles Dental Clinic</div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>Košice, Slovakia ▾</div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ flex: 1, padding: "8px 0" }}>
        {menuItems.map(item => (
          <div key={item.path} onClick={() => setActive(item.path)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", background: active === item.path ? "#1E293B" : "transparent", borderLeft: `3px solid ${active === item.path ? "#4F5BD5" : "transparent"}`, color: active === item.path ? "#fff" : "#64748B", fontSize: 13, fontWeight: active === item.path ? 600 : 400, transition: "all .15s", marginBottom: 1 }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.path === "predictions" && (
              <span style={{ marginLeft: "auto", background: "#4F5BD5", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "2px 6px" }}>AI</span>
            )}
          </div>
        ))}
      </div>

      {/* User profile */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #1E293B", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4F5BD5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>MG</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#CBD5E1" }}>Manjesh Gowda</div>
          <div style={{ fontSize: 10, color: "#475569" }}>Admin</div>
        </div>
      </div>
    </div>
  );
}