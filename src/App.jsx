import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4FF", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      
      {/* Sidebar */}
      <Sidebar active={activePage} setActive={setActivePage} />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* TopBar */}
        <TopBar page={activePage} />

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {activePage === "dashboard"    && <Dashboard />}
          {activePage === "appointments" && <Appointments />}
          {activePage === "predictions"  && <div style={{ padding: 24, color: "#64748B" }}>AI Predictions — Coming soon!</div>}
          {activePage === "revenue"      && <div style={{ padding: 24, color: "#64748B" }}>Revenue — Coming soon!</div>}
          {activePage === "patients"     && <div style={{ padding: 24, color: "#64748B" }}>Patients — Coming soon!</div>}
          {activePage === "settings"     && <div style={{ padding: 24, color: "#64748B" }}>Settings — Coming soon!</div>}
        </div>
      </div>
    </div>
  );
}