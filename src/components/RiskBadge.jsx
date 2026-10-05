import { useSettings, riskLevel } from "../SettingsContext";

const STYLES = {
  critical: ["#FEF2F2", "#DC2626", "CRITICAL"],
  high: ["#FFF7ED", "#B45309", "HIGH"],
  moderate: ["#FFFBEB", "#B45309", "MODERATE"],
  low: ["#ECFDF5", "#059669", "LOW"],
};

// Thresholds come from Settings → AI & risk rules
export default function RiskBadge({ prob }) {
  const { risk } = useSettings();
  const pct = Math.round(prob * 100);
  const [bg, color, label] = STYLES[riskLevel(prob, risk)];

  return (
    <span style={{
      background: bg,
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: 6,
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      whiteSpace: "nowrap"
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {label} {pct}%
    </span>
  );
}
