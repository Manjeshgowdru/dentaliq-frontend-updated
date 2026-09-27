import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const SERVICES = [
  {
    id: "checkup",
    name: "Initial Dental Consultation",
    localName: "Vstupné vyšetrenie",
    duration: "30 min",
    tag: "Recommended for new patients",
    icon: "🩺"
  },
  {
    id: "hygiene",
    name: "Comprehensive Dental Hygiene",
    localName: "Dentálna hygiena",
    duration: "45 min",
    tag: "Deep clean & airflow polish",
    icon: "✨"
  },
  {
    id: "filling",
    name: "Aesthetic Composite Filling",
    localName: "Zubná výplň / Plomba",
    duration: "45 min",
    tag: "High-grade color matching",
    icon: "🦷"
  },
  {
    id: "whitening",
    name: "In-Clinic Laser Teeth Whitening",
    localName: "Bielenie zubov",
    duration: "60 min",
    tag: "Up to 6 shades lighter",
    icon: "💎"
  },
  {
    id: "emergency",
    name: "Acute Emergency Pain Relief",
    localName: "Akútna bolesť / Pohotovosť",
    duration: "30 min",
    tag: "Priority treatment",
    icon: "🚨"
  },
  {
    id: "other",
    name: "Other / Specific Concern",
    localName: "Iné vyšetrenie / Špecifický problém",
    duration: "30 min",
    tag: "Specify details below",
    icon: "📝"
  }
];

export default function PublicBooking() {
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [otherServiceText, setOtherServiceText] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("+421");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successEvent, setSuccessEvent] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Live slots fetch whenever date changes
  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setErrorMessage("");
      setSelectedSlot("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/calendar/available-slots?date=${selectedDate}`);
        if (!res.ok) throw new Error("Unable to reach calendar engine");
        const data = await res.json();
        const slots = data.available_slots || [];
        setAvailableSlots(slots);
        if (slots.length > 0) setSelectedSlot(slots[0]);
      } catch (err) {
        console.error("Calendar fetch error:", err);
        setErrorMessage("Could not sync live clinic availability for this date.");
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedSlot) {
      setErrorMessage("Please select a convenient appointment time.");
      return;
    }

    const cleanPhone = patientPhone.trim().replace(/\s+/g, "");
    if (!/^\+[0-9]{9,15}$/.test(cleanPhone)) {
      setErrorMessage("Please provide a valid phone number with country code (e.g. +421905123456).");
      return;
    }

    const procedureName = selectedService.id === "other" && otherServiceText.trim()
      ? `Other: ${otherServiceText.trim()}`
      : selectedService.name;

    setSubmitting(true);

    const payload = {
      date: selectedDate,
      time: selectedSlot,
      patient_name: patientName.trim(),
      patient: patientName.trim(),
      phone: cleanPhone,
      treatment_type: procedureName,
      procedure: procedureName,
      provider: "Dr. Novak",
      fee: 0,
      risk_level: "Low"
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/calendar/book-or-resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        setErrorMessage(`Slot ${selectedSlot} was just booked. Please pick another open time.`);
        const reload = await fetch(`${API_BASE_URL}/api/calendar/available-slots?date=${selectedDate}`);
        const reloadData = await reload.json();
        setAvailableSlots(reloadData.available_slots || []);
        return;
      }

      if (!res.ok) {
        throw new Error(data.detail || "Error confirming calendar booking");
      }

      setSuccessEvent({
        ...payload,
        event_id: data.event_id
      });
    } catch (err) {
      console.error("Booking error:", err);
      setErrorMessage(err.message || "Could not complete scheduling. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const morningSlots = availableSlots.filter(s => parseInt(s.split(":")[0], 10) < 12);
  const afternoonSlots = availableSlots.filter(s => parseInt(s.split(":")[0], 10) >= 12);

  if (successEvent) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: "#ffffff", width: "100%", maxWidth: 480, borderRadius: 20, padding: "32px 24px", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ECFDF5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>
            ✓
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4F5BD5", letterSpacing: "1px", textTransform: "uppercase" }}>RESERVATION CONFIRMED</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "8px 0 10px" }}>We look forward to seeing you</h2>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, margin: "0 0 24px" }}>
            Your visit has been recorded in the clinic calendar. An SMS confirmation will be sent shortly.
          </p>

          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: "16px", textAlign: "left", marginBottom: 24, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #E2E8F0" }}>
              <span style={{ color: "#64748B" }}>Procedure:</span>
              <strong style={{ color: "#0F172A", textAlign: "right" }}>{successEvent.treatment_type}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #E2E8F0" }}>
              <span style={{ color: "#64748B" }}>Date & Time:</span>
              <strong style={{ color: "#0F172A" }}>{successEvent.date} at {successEvent.time}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Patient:</span>
              <strong style={{ color: "#0F172A" }}>{successEvent.patient_name}</strong>
            </div>
          </div>

          <button
            onClick={() => {
              setSuccessEvent(null);
              setPatientName("");
              setPatientPhone("+421");
              setOtherServiceText("");
            }}
            style={{ width: "100%", padding: "14px", background: "#4F5BD5", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Book Another Visit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "24px 16px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        .booking-container {
          max-width: 960px;
          margin: 0 auto;
        }
        .booking-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
        }
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        @media (max-width: 768px) {
          .booking-grid {
            grid-template-columns: 1fr;
          }
          .slot-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .clinic-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px;
          }
        }
      `}</style>

      <div className="booking-container">
        
        {/* Clinic Header */}
        <div className="clinic-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "18px 20px", borderRadius: 16, boxShadow: "0 2px 6px rgba(0,0,0,0.03)", border: "1px solid #E2E8F0", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #4F5BD5 0%, #3B82F6 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff" }}>
              🦷
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Smiles Dental Clinic</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Hlavná 42, Staré Mesto, Košice · ★ 4.9 (340+ reviews)</div>
            </div>
          </div>
          <span style={{ background: "#ECFDF5", color: "#059669", padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, border: "1px solid #A7F3D0" }}>
            ● Accepting New Patients
          </span>
        </div>

        {errorMessage && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA", fontSize: 13, marginBottom: 20 }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleBooking} className="booking-grid">
          
          {/* Left Column: Choices */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Step 1: Select Treatment */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
                1. Select Treatment
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SERVICES.map((s) => {
                  const isSelected = selectedService.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: isSelected ? "2px solid #4F5BD5" : "1px solid #E2E8F0",
                        background: isSelected ? "#F5F7FF" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{s.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#4F5BD5" : "#0F172A" }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{s.tag} · {s.duration}</div>
                        </div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: isSelected ? "5px solid #4F5BD5" : "2px solid #CBD5E1", background: "#fff" }} />
                    </div>
                  );
                })}

                {/* Optional note field if Other is chosen */}
                {selectedService.id === "other" && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder="Please specify your dental concern (e.g. Broken crown, orthodontic inquiry)..."
                      value={otherServiceText}
                      onChange={(e) => setOtherServiceText(e.target.value)}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Date & Slots */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
                2. Choose Appointment Slot
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>SELECT PREFERRED DATE</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>

              {loadingSlots ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#64748B", fontSize: 13 }}>
                  Verifying live doctor availability...
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={{ padding: 14, background: "#F8FAFC", borderRadius: 10, textAlign: "center", color: "#64748B", fontSize: 13, border: "1px dashed #CBD5E1" }}>
                  All slots are booked for this date. Please pick another day.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {morningSlots.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", marginBottom: 6 }}>MORNING SLOTS</div>
                      <div className="slot-grid">
                        {morningSlots.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: "9px 0",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              border: selectedSlot === slot ? "2px solid #4F5BD5" : "1px solid #E2E8F0",
                              background: selectedSlot === slot ? "#4F5BD5" : "#ffffff",
                              color: selectedSlot === slot ? "#ffffff" : "#334155"
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {afternoonSlots.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", marginBottom: 6 }}>AFTERNOON SLOTS</div>
                      <div className="slot-grid">
                        {afternoonSlots.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: "9px 0",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              border: selectedSlot === slot ? "2px solid #4F5BD5" : "1px solid #E2E8F0",
                              background: selectedSlot === slot ? "#4F5BD5" : "#ffffff",
                              color: selectedSlot === slot ? "#ffffff" : "#334155"
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Contact & Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Step 3: Information */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
                3. Your Information
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>FULL NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Peter Kovac"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>PHONE NUMBER (WITH COUNTRY CODE)</label>
                <input
                  type="tel"
                  placeholder="+421905123456"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Live Booking Summary Card */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
                Booking Summary
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#334155", paddingBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Procedure:</span>
                  <span style={{ fontWeight: 600, textAlign: "right" }}>
                    {selectedService.id === "other" && otherServiceText.trim()
                      ? `Other: ${otherServiceText.trim()}`
                      : selectedService.name}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Date:</span>
                  <span style={{ fontWeight: 600 }}>{selectedDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Scheduled Time:</span>
                  <span style={{ fontWeight: 700, color: selectedSlot ? "#4F5BD5" : "#94A3B8" }}>
                    {selectedSlot || "Select a slot"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Assigned Doctor:</span>
                  <span style={{ fontWeight: 600 }}>Dr. Novak</span>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  style={{
                    width: "100%",
                    padding: "13px",
                    background: "linear-gradient(135deg, #4F5BD5 0%, #3B82F6 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: submitting || !selectedSlot ? "not-allowed" : "pointer",
                    opacity: submitting || !selectedSlot ? 0.6 : 1,
                    boxShadow: "0 4px 12px rgba(79, 91, 213, 0.3)"
                  }}
                >
                  {submitting ? "Booking Appointment..." : "Confirm My Reservation →"}
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#94A3B8" }}>
                🔒 Direct calendar booking · Free cancellation up to 24h prior
              </div>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}