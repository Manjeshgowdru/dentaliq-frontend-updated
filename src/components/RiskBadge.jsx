export default function RiskBadge({ prob }) {
  const pct = Math.round(prob * 100);
  
  const [bg, color, label] =
    prob >= 0.55 ? ["#FEF2F2", "#DC2626", "CRITICAL"] :
    prob >= 0.38 ? ["#FFF7ED", "#B45309", "HIGH"]     :
    prob >= 0.22 ? ["#FFFBEB", "#B45309", "MODERATE"] :
                   ["#ECFDF5", "#059669", "LOW"];

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
      gap: 5
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {label} {pct}%
    </span>
  );
}