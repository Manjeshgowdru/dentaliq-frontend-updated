import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const DEFAULT_RISK = {
  moderate: 0.2,
  high: 0.32,
  critical: 0.45,
  actions: {
    low: "Monitor only",
    moderate: "SMS confirmation",
    high: "WhatsApp reminder",
    critical: "Call + WhatsApp + deposit request",
  },
};

const SettingsContext = createContext({ settings: null, risk: DEFAULT_RISK, reloadSettings: () => {}, setSettings: () => {} });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  const reloadSettings = async () => {
    try {
      setSettings(await api("/api/settings"));
    } catch (err) {
      console.warn("Could not load clinic settings; using defaults.", err);
    }
  };

  useEffect(() => {
    reloadSettings();
  }, []);

  const risk = settings?.risk || DEFAULT_RISK;
  return (
    <SettingsContext.Provider value={{ settings, risk, reloadSettings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function riskLevel(prob, risk = DEFAULT_RISK) {
  if (prob >= risk.critical) return "critical";
  if (prob >= risk.high) return "high";
  if (prob >= risk.moderate) return "moderate";
  return "low";
}
