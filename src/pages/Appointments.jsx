import { useState, useEffect } from "react";
import RiskBadge from "../components/RiskBadge";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const INITIAL_PATIENTS = [
  { time: "09:00", name: "Eva Šimková",    proc: "Scaling & Polishing", prob: 0.12, status: "Completed", provider: "Dr. Patel",    fee: 95,  phone: "+421905111222" },
  { time: "10:30", name: "Peter Kováč",    proc: "Cleaning",            prob: 0.82, status: "Upcoming",  provider: "Dr. Chen",     fee: 175, phone: "+421905333444" },
  { time: "11:30", name: "Anna Balážová",  proc: "Filling",             prob: 0.58, status: "Upcoming",  provider: "Dr. Williams", fee: 220, phone: "+421905555666" },
  { time: "13:00", name: "Tomáš Mikuš",    proc: "Root Canal",          prob: 0.22, status: "Upcoming",  provider: "Dr. Santos",   fee: 310, phone: "+421905777888" },
  { time: "14:00", name: "Lucia Nováková", proc: "Implant Consult",     prob: 0.65, status: "Upcoming",  provider: "Dr. Kim",      fee: 480, phone: "+421905999000" },
  { time: "15:00", name: "Jana Tothová",   proc: "Crown Prep",          prob: 0.18, status: "Upcoming",  provider: "Dr. Patel",    fee: 390, phone: "+421908123456" },
  { time: "16:00", name: "Martin Horváth", proc: "Extraction",          prob: 0.44, status: "Upcoming",  provider: "Dr. Chen",     fee: 150, phone: "+421908654321" },
];

const action = prob =>
  prob >= 0.55 ? "📞 Call + WhatsApp + Request Deposit" :
  prob >= 0.38 ? "📲 Send WhatsApp Reminder"            :
  prob >= 0.22 ? "💬 Send SMS Confirmation"             :
                 "✅ Monitor Only";

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [patientList, setPatientList] = useState(INITIAL_PATIENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingSchedule, setFetchingSchedule] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const [formData, setFormData] = useState({
    date: selectedDate,
    time: "10:00",
    patient_name: "",
    patient_phone: "",
    treatment_type: "Vstupné vyšetrenie",
    provider: "Dr. Patel",
    fee: 150,
  });

  // Re-fetch calendar events whenever selectedDate changes
  useEffect(() => {
    const fetchLiveSchedule = async () => {
      setFetchingSchedule(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/calendar/events?date=${selectedDate}`);
        if (!res.ok) {
          setFetchingSchedule(false);
          return;
        }

        const data = await res.json();
        if (data.events) {
          setPatientList(data.events);
        }
      } catch (err) {
        console.warn("Could not fetch live calendar schedule; keeping fallback state.", err);
      } finally {
        setFetchingSchedule(false);
      }
    };

    fetchLiveSchedule();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setFormData(prev => ({ ...prev, date: newDate }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleActionClick = (patient) => {
    const rawPhone = patient.phone || "";
    const cleanDigits = rawPhone.replace(/[^0-9]/g, "");
    const name = patient.name;
    const time = patient.time;
    const clinicName = "Gowdris Labs Dental Clinic";

    const msg = encodeURIComponent(
      `Dobrý deň ${name}, pripomíname Vám termín vyšetrenia v ${clinicName} o ${time}. V prípade zmeny termínu nás prosím bezodkladne kontaktujte.`
    );

    if (patient.prob >= 0.38) {
      if (!cleanDigits) {
        alert(`No valid phone number found for ${name}`);
        return;
      }
      window.open(`https://wa.me/${cleanDigits}?text=${msg}`, "_blank");
    } else if (patient.prob >= 0.22) {
      if (!rawPhone) {
        alert(`No valid phone number found for ${name}`);
        return;
      }
      window.location.href = `sms:${rawPhone}?body=${msg}`;
    } else {
      alert(`Patient ${name} is categorized as Low Risk. No immediate action required.`);
    }
  };

  const handleCancelAppointment = async (patient) => {
    if (!patient.id) {
      // Fallback for static mock items without a calendar ID
      setPatientList(prev => prev.filter(p => p !== patient));
      return;
    }

    const confirmed = window.confirm(`Cancel appointment for ${patient.name} at ${patient.time}? This will delete it from Google Calendar.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/calendar/events/${patient.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      // Remove immediately from the UI view
      setPatientList(prev => prev.filter(p => p.id !== patient.id));
    } catch (err) {
      console.error("Deletion error:", err);
      alert("Failed to delete appointment from Google Calendar. Check console for details.");
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setConflictData(null);
    setStatusMessage(null);

    // 1. Working hours validation (08:00 - 16:30 for 30-min slot)
    const [hours, minutes] = formData.time.split(":").map(Number);
    if (hours < 8 || hours >= 17 || (hours === 16 && minutes > 30)) {
      setStatusMessage({
        type: "error",
        text: "Appointments can only be scheduled during clinic working hours (08:00 – 17:00)."
      });
      return;
    }

    // 2. Patient name validation
    if (formData.patient_name.trim().length < 2) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid patient name."
      });
      return;
    }

    // 3. International phone format validation (+421...)
    const phoneClean = formData.patient_phone.trim().replace(/\s+/g, "");
    const phoneRegex = /^\+[0-9]{9,15}$/;
    if (!phoneRegex.test(phoneClean)) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid international phone number starting with '+' (e.g. +421905123456)."
      });
      return;
    }

    setLoading(true);

    const payload = {
      date: formData.date,
      time: formData.time,
      patient_name: formData.patient_name.trim(),
      patient_phone: phoneClean,
      treatment_type: formData.treatment_type,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/calendar/book-or-resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "booked") {
        setStatusMessage({ type: "success", text: result.message || "Appointment booked successfully!" });
        
        // Append dynamically if looking at current target date
        if (formData.date === selectedDate) {
          const newPatientEntry = {
            id: result.event_id,
            time: formData.time,
            name: formData.patient_name,
            proc: formData.treatment_type,
            prob: 0.15,
            status: "Upcoming",
            provider: formData.provider,
            fee: Number(formData.fee) || 150,
            phone: phoneClean,
          };
          setPatientList(prev => [newPatientEntry, ...prev]);
        }

        setTimeout(() => {
          setIsModalOpen(false);
          setStatusMessage(null);
          setFormData(prev => ({ ...prev, patient_name: "", patient_phone: "" }));
        }, 1200);

      } else if (result.status === "conflict") {
        setConflictData(result);
        setStatusMessage({
          type: "warning",
          text: `Slot ${result.requested_time} is occupied. Please pick an alternative below.`
        });
      }
    } catch (err) {
      console.error("Booking error:", err);
      setStatusMessage({ 
        type: "error", 
        text: `Failed to connect to backend engine at ${API_BASE_URL}. Ensure Uvicorn is running.` 
      });
    } finally {
      setLoading(false);
    }
  };

  const selectAlternative = (altTime) => {
    setFormData(prev => ({ ...prev, time: altTime }));
    setConflictData(null);
    setStatusMessage(null);
  };

  return (
    <div style={{ padding: 24, position: "relative" }}>

      {/* Header with Date Navigator */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>Clinic Appointments</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
            Showing schedule for <strong>{selectedDate}</strong> {fetchingSchedule && "· Syncing..."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              fontSize: 13,
              color: "#334155",
              background: "#fff",
              outline: "none",
              cursor: "pointer"
            }}
          />
          <button
            onClick={() => { 
              setFormData(prev => ({ ...prev, date: selectedDate }));
              setIsModalOpen(true); 
              setStatusMessage(null); 
              setConflictData(null); 
            }}
            style={{ background: "#4F5BD5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            + Add Appointment
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          ["Total Booked", patientList.length, "#4F5BD5"],
          ["Critical Risk", patientList.filter(p => p.prob >= 0.55).length, "#DC2626"],
          ["Expected Revenue", `€${patientList.reduce((s, p) => s + (Number(p.fee) || 0), 0).toLocaleString()}`, "#059669"],
          ["Completed", patientList.filter(p => p.status === "Completed").length, "#0891B2"],
        ].map(([label, val, col]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, borderTop: `3px solid ${col}`, padding: "14px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: col }}>{val}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, textTransform: "uppercase", letterSpacing: ".6px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              {["Time", "Patient", "Procedure", "Provider", "Fee", "AI Risk", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".8px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patientList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                  No appointments scheduled for {selectedDate}.
                </td>
              </tr>
            ) : (
              [...patientList].sort((a, b) => (a.time > b.time ? 1 : -1)).map((p, i) => (
                <tr key={p.id || i} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "#fff" : "#FAFBFF" }}>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 13, color: "#475569" }}>{p.time}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{p.status}</div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#475569" }}>{p.proc}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#475569" }}>{p.provider}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "#059669", fontFamily: "monospace" }}>€{p.fee}</td>
                  <td style={{ padding: "13px 16px" }}><RiskBadge prob={p.prob} /></td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleActionClick(p)}
                        style={{
                          background: p.prob >= 0.55 ? "#FEF2F2" : p.prob >= 0.38 ? "#ECFDF5" : "#F8FAFC",
                          color: p.prob >= 0.55 ? "#DC2626" : p.prob >= 0.38 ? "#059669" : "#0891B2",
                          border: `1px solid ${p.prob >= 0.55 ? "#FECACA" : p.prob >= 0.38 ? "#A7F3D0" : "#E2E8F0"}`,
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {action(p.prob)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(p)}
                        title="Cancel Appointment"
                        style={{
                          background: "transparent",
                          border: "1px solid #CBD5E1",
                          borderRadius: 6,
                          padding: "6px 9px",
                          marginLeft: 8,
                          cursor: "pointer",
                          color: "#94A3B8",
                          fontSize: 12,
                          lineHeight: 1
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999
        }}>
          <div style={{
            background: "#fff", width: "100%", maxWidth: 440, borderRadius: 12,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #E2E8F0", padding: 24
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Book New Appointment</div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: 18, color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {statusMessage && (
              <div style={{
                padding: "10px 14px", borderRadius: 6, fontSize: 12, marginBottom: 16,
                background: statusMessage.type === "success" ? "#ECFDF5" : statusMessage.type === "warning" ? "#FFFBEB" : "#FEF2F2",
                color: statusMessage.type === "success" ? "#065F46" : statusMessage.type === "warning" ? "#B45309" : "#991B1B",
                border: `1px solid ${statusMessage.type === "success" ? "#A7F3D0" : statusMessage.type === "warning" ? "#FDE68A" : "#FECACA"}`
              }}>
                {statusMessage.text}
              </div>
            )}

            {conflictData && conflictData.suggested_alternatives && conflictData.suggested_alternatives.length > 0 && (
              <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 8 }}>Available Open Slots:</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {conflictData.suggested_alternatives.map(alt => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => selectAlternative(alt)}
                      style={{
                        padding: "6px 12px", background: "#4F5BD5", color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer"
                      }}
                    >
                      Book {alt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleBookAppointment}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Time (08:00 - 16:30)</label>
                  <input
                    type="time"
                    name="time"
                    min="08:00"
                    max="16:30"
                    step="1800"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Fee (€)</label>
                  <input
                    type="number"
                    name="fee"
                    value={formData.fee}
                    onChange={handleInputChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Patient Name</label>
                <input
                  type="text"
                  name="patient_name"
                  placeholder="e.g. Peter Kovac"
                  value={formData.patient_name}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Phone (+Country Code)</label>
                <input
                  type="tel"
                  name="patient_phone"
                  placeholder="+421905123456"
                  value={formData.patient_phone}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Treatment Type</label>
                <input
                  type="text"
                  name="treatment_type"
                  value={formData.treatment_type}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "8px 14px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "8px 18px", background: "#4F5BD5", color: "#fff",
                    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? "Syncing..." : "Confirm & Sync Calendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}