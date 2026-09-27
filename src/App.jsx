import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import PublicBooking from "./pages/PublicBooking";

export default function App() {
  // Check if current browser URL is /book or ?page=book
  const isBookUrl = 
    window.location.pathname === "/book" || 
    new URLSearchParams(window.location.search).get("page") === "book";

  const [activePage, setActivePage] = useState(isBookUrl ? "book" : "dashboard");

  // Listen for browser navigation changes
  useEffect(() => {
    const handlePopState = () => {
      const isBook = 
        window.location.pathname === "/book" || 
        new URLSearchParams(window.location.search).get("page") === "book";
      setActivePage(isBook ? "book" : "dashboard");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // When on the public booking page, render full screen without clinic admin layout
  if (activePage === "book") {
    return (
      <div>
        {/* Floating return button for admin testing */}
        <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
          <button
            onClick={() => {
              window.history.pushState({}, "", "/");
              setActivePage("dashboard");
            }}
            style={{
              padding: "8px 14px",
              background: "#0F172A",
              color: "#fff",
              border: "1px solid #334155",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
          >
            ← Back to Clinic Portal
          </button>
        </div>
        <PublicBooking />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4FF", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      
      {/* Sidebar */}
      <Sidebar active={activePage} setActive={setActivePage} />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* TopBar with direct Customer Page preview link */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <TopBar page={activePage} />
          </div>
          <div style={{ paddingRight: 24 }}>
            <button
              onClick={() => {
                window.history.pushState({}, "", "/book");
                setActivePage("book");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "linear-gradient(135deg, #4F5BD5 0%, #3B82F6 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(79,91,213,0.3)"
              }}
            >
              🌐 Open Patient Booking Page ↗
            </button>
          </div>
        </div>

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