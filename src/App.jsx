import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import PublicBooking from "./pages/PublicBooking";
import Patients from "./pages/Patients";
import Predictions from "./pages/Predictions";
import Financial from "./pages/Financial";
import Stock from "./pages/Stock";
import Equipment from "./pages/Equipment";
import Treatment from "./pages/Treatment";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import LabOrders from "./pages/LabOrders";
import Procurement from "./pages/Procurement";
import Settings from "./pages/Settings";

// Every portal page has its own URL, so refresh, bookmarks and Back/Forward keep you on the same page.
const PAGES = ["dashboard", "appointments", "patients", "predictions", "financial", "stock", "equipment",
               "treatment", "billing", "reports", "lab", "procurement", "settings"];

function pageFromLocation() {
  const { pathname, search } = window.location;
  if (pathname === "/book" || new URLSearchParams(search).get("page") === "book") return "book";
  const slug = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!slug) return "dashboard";
  return PAGES.includes(slug) ? slug : null;
}

const pathFor = (page) => (page === "dashboard" ? "/" : `/${page}`);

export default function App() {
  const [activePage, setActivePageState] = useState(() => pageFromLocation() || "dashboard");
  const contentRef = useRef(null);

  // Unknown address (e.g. an old link) -> show the dashboard with a clean URL
  useEffect(() => {
    if (pageFromLocation() === null) window.history.replaceState({}, "", "/");
  }, []);

  // Browser Back / Forward
  useEffect(() => {
    const handlePopState = () => setActivePageState(pageFromLocation() || "dashboard");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sidebar: desktop collapses to an icon rail (remembered), small screens use a slide-in drawer
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("dentaliq.sidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = (e) => { setIsMobile(e.matches); setDrawerOpen(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("dentaliq.sidebarCollapsed", c ? "0" : "1");
      } catch {
        /* storage unavailable: still works for this visit */
      }
      return !c;
    });
  };
  const toggleMenu = () => (isMobile ? setDrawerOpen((o) => !o) : toggleCollapsed());

  // Navigate inside the app: update the URL and start the new page at the top
  const [navKey, setNavKey] = useState(0);
  const setActivePage = (page, params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const target = pathFor(page) + query;
    if (target !== window.location.pathname + window.location.search) window.history.pushState({}, "", target);
    setActivePageState(page);
    if (params) setNavKey((k) => k + 1); // re-open the page so it picks up the new deep link
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  useEffect(() => {
    const titles = { book: "Book an appointment", dashboard: "Dashboard", appointments: "Appointments", patients: "Patients",
      predictions: "AI Predictions", financial: "Financial Intelligence", stock: "Stock Manager", equipment: "Equipment Scheduler",
      treatment: "Treatment & Plans", billing: "Billing & Invoices", reports: "Reports", lab: "Lab Orders", procurement: "Procurement", settings: "Settings" };
    document.title = `${titles[activePage] || "DentalIQ"} · DentalIQ`;
  }, [activePage]);

  // When on the public booking page, render full screen without clinic admin layout
  if (activePage === "book") {
    return (
      <div>
        {/* Floating return button for admin testing */}
        <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
          <button
            onClick={() => {
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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F0F4FF", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      
      {/* Sidebar */}
      <Sidebar
        active={activePage}
        setActive={setActivePage}
        collapsed={collapsed}
        mobile={isMobile}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onToggle={toggleCollapsed}
      />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* TopBar with direct Customer Page preview link */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <TopBar page={activePage} onToggleMenu={toggleMenu} menuOpen={isMobile ? drawerOpen : !collapsed} onNavigate={setActivePage} compact={isMobile} />
          </div>
          <div style={{ paddingRight: 24 }}>
            <button
              onClick={() => {
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
        <div ref={contentRef} key={navKey} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {activePage === "dashboard"    && <Dashboard onNavigate={setActivePage} />}
          {activePage === "appointments" && <Appointments />}
          {activePage === "patients"     && <Patients />}
          {activePage === "predictions"  && <Predictions />}
          {activePage === "financial"    && <Financial />}
          {activePage === "stock"        && <Stock onNavigate={setActivePage} />}
          {activePage === "equipment"    && <Equipment />}
          {activePage === "treatment"    && <Treatment />}
          {activePage === "billing"      && <Billing />}
          {activePage === "reports"      && <Reports />}
          {activePage === "lab"          && <LabOrders />}
          {activePage === "procurement"  && <Procurement />}
          {activePage === "settings"     && <Settings />}
        </div>
      </div>
    </div>
  );
}