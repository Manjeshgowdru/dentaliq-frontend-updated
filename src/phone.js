// Turns what people actually type into +<country><number> (same rules as the backend), or null.
// '0905 123 456' -> '+421905123456', '00421 905…' -> '+421905…', '+421 0905…' -> '+421905…'
export function normalizePhone(raw, defaultCountry = "421") {
  if (!raw) return null;
  let s = String(raw).trim().replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (!s.startsWith("+")) s = "+" + defaultCountry + (s.startsWith("0") ? s.slice(1) : s);
  if (s.startsWith("+" + defaultCountry + "0")) s = "+" + defaultCountry + s.slice(defaultCountry.length + 2);
  const digits = s.slice(1);
  if (!/^[1-9]\d{8,14}$/.test(digits)) return null;
  return s;
}

export const PHONE_HELP = "Mobile number, e.g. 0905 123 456 or +421 905 123 456";
