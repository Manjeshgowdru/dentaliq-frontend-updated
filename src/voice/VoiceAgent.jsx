import { useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { api } from "../api";
import { normalizePhone } from "../phone";
import { MicStream, Speaker } from "./audio";

// AI voice receptionist: browser <-> Gemini Live (short-lived token from our backend).
// Tools run here against the DentalIQ API: check slots, book, find and cancel appointments.

const TOOL_DECLARATIONS = {
  check_available_slots: {
    name: "check_available_slots",
    description: "Returns the free appointment start times for one date. Always call this before offering times.",
    parameters: { type: Type.OBJECT, properties: { date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" } }, required: ["date"] },
  },
  book_appointment: {
    name: "book_appointment",
    description: "Books an appointment after the caller confirmed treatment, date, time, name and phone number.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "YYYY-MM-DD" },
        time: { type: Type.STRING, description: "HH:MM, one of the free times returned by check_available_slots" },
        patient_name: { type: Type.STRING, description: "Caller's full name" },
        phone: { type: Type.STRING, description: "Caller's mobile number as they said it" },
        treatment: { type: Type.STRING, description: "Treatment name from the clinic's list" },
      },
      required: ["date", "time", "patient_name", "phone", "treatment"],
    },
  },
  find_my_appointments: {
    name: "find_my_appointments",
    description: "Finds the caller's upcoming appointments by the phone number used for booking.",
    parameters: { type: Type.OBJECT, properties: { phone: { type: Type.STRING } }, required: ["phone"] },
  },
  cancel_appointment: {
    name: "cancel_appointment",
    description: "Cancels one appointment found with find_my_appointments, after the caller confirmed.",
    parameters: { type: Type.OBJECT, properties: { event_id: { type: Type.STRING }, phone: { type: Type.STRING } }, required: ["event_id", "phone"] },
  },
  end_call: {
    name: "end_call",
    description: "Ends the call after you have said goodbye.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
};

const STATUS_TEXT = {
  idle: "Ready",
  connecting: "Connecting…",
  live: "Connected",
  ended: "Call ended",
  error: "Error",
};

export default function VoiceAgent({ test = false, onClose, compact = false }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [lines, setLines] = useState([]); // {who: 'you'|'ai'|'tool', text}
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [booked, setBooked] = useState(null);

  const sessionRef = useRef(null);
  const micRef = useRef(null);
  const speakerRef = useRef(null);
  const timerRef = useRef(null);
  const limitRef = useRef(5);
  const treatmentsRef = useRef([]);
  const endingRef = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => () => hangUp(true), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const addLine = (who, text, append = false) => {
    if (!text) return;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (append && last && last.who === who && !last.done) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev.map((l) => ({ ...l, done: true })), { who, text, done: false }];
    });
  };

  const finishTurn = () => setLines((prev) => prev.map((l) => ({ ...l, done: true })));

  const priceFor = (treatment) => {
    const t = (treatment || "").toLowerCase();
    const hit = treatmentsRef.current.find((x) => x.name.toLowerCase() === t || x.name_sk.toLowerCase() === t)
      || treatmentsRef.current.find((x) => t.includes(x.name.toLowerCase()) || t.includes(x.name_sk.toLowerCase()));
    return hit ? hit.price : 0;
  };

  async function runTool(name, args) {
    switch (name) {
      case "check_available_slots": {
        const r = await api(`/api/calendar/available-slots?date=${encodeURIComponent(args.date)}`);
        let slots = r.available_slots || [];
        const now = new Date();
        const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        if (args.date === todayIso) {
          const hhmm = `${String(now.getHours() + 1).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          slots = slots.filter((s) => s >= hhmm);
        }
        addLine("tool", `🔎 Checked free times for ${args.date}: ${slots.length ? slots.slice(0, 6).join(", ") + (slots.length > 6 ? "…" : "") : "none"}`);
        return slots.length ? { date: r.date, free_times: slots } : { date: r.date, free_times: [], note: "No free times (closed or fully booked). Offer another day." };
      }
      case "book_appointment": {
        const phone = normalizePhone(args.phone);
        if (!phone) return { status: "error", message: "The phone number is not valid. Ask the caller to repeat it." };
        const r = await api("/api/calendar/book-or-resolve", {
          method: "POST",
          body: { date: args.date, time: args.time, patient_name: args.patient_name, phone, treatment_type: args.treatment, provider: "Dr. Novak", fee: priceFor(args.treatment), risk_level: "Low" },
        });
        if (r.status === "conflict") {
          addLine("tool", `⚠️ ${args.time} was just taken — offering ${r.suggested_alternatives.join(", ")}`);
          return { status: "conflict", message: "That time was just taken.", alternatives: r.suggested_alternatives };
        }
        setBooked({ ...args, phone });
        addLine("tool", `✅ Booked: ${args.patient_name} · ${args.treatment} · ${args.date} ${args.time}`);
        return { status: "booked", date: args.date, time: args.time };
      }
      case "find_my_appointments": {
        const r = await api(`/api/voice/my-appointments?phone=${encodeURIComponent(args.phone)}`);
        addLine("tool", `🔎 Found ${r.appointments.length} upcoming appointment(s) for ${r.phone}`);
        return r;
      }
      case "cancel_appointment": {
        const r = await api("/api/voice/cancel", { method: "POST", body: { event_id: args.event_id, phone: args.phone } });
        addLine("tool", `🗑️ Cancelled ${r.cancelled.date} ${r.cancelled.time}`);
        return r;
      }
      case "end_call": {
        endingRef.current = true;
        const sp = speakerRef.current;
        const finish = () => setTimeout(() => hangUp(), 400);
        if (sp?.speaking) sp.onIdle = finish;
        else setTimeout(() => hangUp(), 1500);
        return { status: "ending" };
      }
      default:
        return { error: `Unknown tool ${name}` };
    }
  }

  async function handleToolCall(toolCall) {
    const responses = [];
    for (const fc of toolCall.functionCalls || []) {
      let response;
      try {
        response = await runTool(fc.name, fc.args || {});
      } catch (e) {
        addLine("tool", `❌ ${fc.name}: ${e.message}`);
        response = { status: "error", message: e.message };
      }
      responses.push({ id: fc.id, name: fc.name, response });
    }
    sessionRef.current?.sendToolResponse({ functionResponses: responses });
  }

  function handleMessage(msg) {
    if (msg.toolCall) handleToolCall(msg.toolCall);
    const sc = msg.serverContent;
    if (sc) {
      if (sc.interrupted) {
        speakerRef.current?.interrupt();
        setSpeaking(false);
      }
      for (const part of sc.modelTurn?.parts || []) {
        if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/")) {
          const rate = Number((part.inlineData.mimeType.match(/rate=(\d+)/) || [])[1]) || 24000;
          speakerRef.current?.play(part.inlineData.data, rate);
          setSpeaking(true);
        }
      }
      if (sc.inputTranscription?.text) addLine("you", sc.inputTranscription.text, true);
      if (sc.outputTranscription?.text) addLine("ai", sc.outputTranscription.text, true);
      if (sc.turnComplete) finishTurn();
    }
    if (msg.goAway) addLine("tool", "Connection is about to close.");
  }

  async function startCall() {
    setError(null);
    setLines([]);
    setBooked(null);
    setSeconds(0);
    endingRef.current = false;
    setStatus("connecting");
    try {
      const speaker = new Speaker();
      await speaker.resume(); // must happen inside the click
      speaker.onIdle = () => setSpeaking(false);
      speakerRef.current = speaker;

      const s = await api("/api/voice/session", { method: "POST", body: { test } });
      limitRef.current = s.max_call_minutes || 5;
      treatmentsRef.current = s.treatments || [];

      const tools = [TOOL_DECLARATIONS.check_available_slots];
      if (s.can_book) tools.push(TOOL_DECLARATIONS.book_appointment);
      if (s.can_cancel) tools.push(TOOL_DECLARATIONS.find_my_appointments, TOOL_DECLARATIONS.cancel_appointment);
      tools.push(TOOL_DECLARATIONS.end_call);

      const ai = new GoogleGenAI({ apiKey: s.token, httpOptions: { apiVersion: s.api_version || "v1alpha" } });
      const session = await ai.live.connect({
        model: s.model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: s.system_instruction,
          tools: [{ functionDeclarations: tools }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice_name || "Kore" } } },
        },
        callbacks: {
          onopen: () => {},
          onmessage: handleMessage,
          onerror: (e) => {
            console.error("Live API error", e);
            setError(e?.message || "Connection error");
          },
          onclose: (e) => {
            if (!endingRef.current && e?.reason) setError(`Connection closed: ${e.reason}`);
            hangUp(true);
          },
        },
      });
      sessionRef.current = session;

      const mic = new MicStream();
      await mic.start((data, mimeType, peak) => {
        setLevel(peak);
        sessionRef.current?.sendRealtimeInput({ audio: { data, mimeType } });
      });
      micRef.current = mic;

      setStatus("live");
      // Let the receptionist speak first
      session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "(The phone call has just connected. Greet the caller now.)" }] }], turnComplete: true });

      timerRef.current = setInterval(() => {
        setSeconds((x) => {
          if (x + 1 >= limitRef.current * 60) hangUp();
          return x + 1;
        });
      }, 1000);
    } catch (e) {
      console.error(e);
      setError(e.name === "NotAllowedError" ? "Microphone access was blocked. Allow the microphone in your browser and try again." : e.message || String(e));
      hangUp(true);
      setStatus("error");
    }
  }

  function hangUp(silent = false) {
    endingRef.current = true;
    clearInterval(timerRef.current);
    try { sessionRef.current?.close(); } catch { /* already closed */ }
    sessionRef.current = null;
    micRef.current?.stop();
    micRef.current = null;
    speakerRef.current?.close();
    speakerRef.current = null;
    setSpeaking(false);
    setLevel(0);
    if (!silent) setStatus("ended");
    else setStatus((st) => (st === "live" || st === "connecting" ? "ended" : st));
  }

  const toggleMute = () => {
    if (micRef.current) micRef.current.muted = !muted;
    setMuted(!muted);
  };

  const live = status === "live";
  const mm = String(Math.floor(seconds / 60)).padStart(1, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ background: "#0F172A", borderRadius: 16, padding: compact ? 16 : 22, color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🎙️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Receptionist {test && <span style={{ fontSize: 10, background: "#7C3AED", borderRadius: 4, padding: "1px 6px", marginLeft: 6 }}>TEST</span>}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>Slovenčina · English · {STATUS_TEXT[status]}{live ? ` · ${mm}:${ss}` : ""}</div>
          </div>
        </div>
        {onClose && <button onClick={() => { hangUp(true); onClose(); }} style={{ background: "transparent", border: "none", color: "#94A3B8", fontSize: 18, cursor: "pointer" }}>✕</button>}
      </div>

      {/* Visualiser */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 110 }}>
        <div style={{
          width: 86, height: 86, borderRadius: "50%",
          background: live ? (speaking ? "linear-gradient(135deg,#4F5BD5,#7C3AED)" : "#1E293B") : "#1E293B",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34,
          boxShadow: live ? `0 0 0 ${speaking ? 14 : Math.round(level * 40)}px rgba(79,91,213,0.25)` : "none",
          transition: "box-shadow .12s, background .2s",
        }}>
          {status === "connecting" ? "⏳" : speaking ? "🗣️" : live ? "👂" : "🦷"}
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginBottom: 12, minHeight: 16 }}>
        {live ? (speaking ? "Receptionist is speaking — you can interrupt anytime" : muted ? "Microphone muted" : "Listening… speak Slovak or English") : status === "connecting" ? "Starting secure call…" : "Book, check or cancel an appointment by voice"}
      </div>

      {error && <div style={{ background: "#7F1D1D", color: "#FECACA", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>{error}</div>}

      {(lines.length > 0 || live) && (
        <div ref={scrollRef} style={{ background: "#111827", borderRadius: 10, padding: 10, height: compact ? 170 : 220, overflowY: "auto", marginBottom: 14, fontSize: 13, lineHeight: 1.45 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ marginBottom: 6, textAlign: l.who === "you" ? "right" : "left" }}>
              {l.who === "tool" ? (
                <div style={{ fontSize: 11, color: "#A5B4FC", fontStyle: "italic" }}>{l.text}</div>
              ) : (
                <span style={{ display: "inline-block", maxWidth: "85%", padding: "6px 10px", borderRadius: 10, background: l.who === "you" ? "#4F5BD5" : "#1F2937", color: "#fff" }}>{l.text}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {booked && (
        <div style={{ background: "#064E3B", color: "#A7F3D0", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
          ✅ Appointment booked: {booked.treatment} on {booked.date} at {booked.time} for {booked.patient_name}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {!live && status !== "connecting" && (
          <button onClick={startCall} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 999, padding: "12px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            📞 {status === "ended" || status === "error" ? "Call again" : "Start call"}
          </button>
        )}
        {live && (
          <>
            <button onClick={toggleMute} style={{ background: muted ? "#B45309" : "#334155", color: "#fff", border: "none", borderRadius: 999, padding: "12px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {muted ? "🔇 Unmute" : "🎤 Mute"}
            </button>
            <button onClick={() => hangUp()} style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 999, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              ⏹ End call
            </button>
          </>
        )}
      </div>
      <div style={{ fontSize: 10, color: "#64748B", textAlign: "center", marginTop: 12 }}>
        You are talking to an AI assistant. The call is not recorded; your name and phone number are used only to manage your appointment.
      </div>
    </div>
  );
}
