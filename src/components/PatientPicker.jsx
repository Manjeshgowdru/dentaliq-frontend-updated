import { useMemo, useState } from "react";
import { useApi } from "../api";
import { C, Input } from "./ui";

// Search-as-you-type patient selector used by billing, plans and lab orders.
export default function PatientPicker({ value, onChange }) {
  const { data } = useApi("/api/patients");
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    if (!data || q.trim().length < 2) return [];
    const ql = q.toLowerCase();
    return data.patients.filter((p) => p.name.toLowerCase().includes(ql) || p.phone.includes(ql) || p.id.toLowerCase().includes(ql)).slice(0, 8);
  }, [data, q]);

  if (value) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}>
        <span><b>{value.name}</b> <span style={{ color: C.tx4 }}>· {value.id} · {value.phone}</span></span>
        <button onClick={() => onChange(null)} style={{ border: "none", background: "transparent", color: C.ind, cursor: "pointer", fontSize: 12 }}>Change</button>
      </div>
    );
  }
  return (
    <div style={{ position: "relative" }}>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type at least 2 letters of name, phone or ID" />
      {matches.length > 0 && (
        <div style={{ position: "absolute", zIndex: 5, top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${C.br}`, borderRadius: 6, boxShadow: "0 8px 16px rgba(0,0,0,.08)", marginTop: 2 }}>
          {matches.map((p) => (
            <div key={p.id} onClick={() => { onChange(p); setQ(""); }} style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer", borderBottom: `1px solid ${C.br2}` }}>
              <b>{p.name}</b> <span style={{ color: C.tx4 }}>· {p.id} · {p.phone}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
