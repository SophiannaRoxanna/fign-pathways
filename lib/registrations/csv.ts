// Minimal RFC 4180 CSV parser. Handles quoted fields, embedded commas,
// and doubled-quote escaping. Returns rows as string[].
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const s = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\n") {
        row.push(cell);
        cell = "";
        if (row.some((v) => v !== "")) rows.push(row);
        row = [];
      } else {
        cell += c;
      }
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.some((v) => v !== "")) rows.push(row);
  }
  return rows;
}

export type ParsedAttendeeRow = {
  email: string;
  name?: string;
  attended?: boolean;
  verified?: boolean;
};

const truthy = (v: string | undefined) =>
  v != null && /^(1|true|yes|y|attended|present|✓)$/i.test(v.trim());

export function parseAttendeeCsv(text: string): ParsedAttendeeRow[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);

  const emailIdx = col("email");
  if (emailIdx < 0) {
    // No header with "email" — assume the first column IS email.
    return rows
      .map((r) => ({ email: (r[0] ?? "").trim() }))
      .filter((r) => r.email);
  }
  const nameIdx = col("name");
  const attendedIdx = col("attended");
  const verifiedIdx = col("verified");

  return rows.slice(1).map((r) => ({
    email: (r[emailIdx] ?? "").trim(),
    name: nameIdx >= 0 ? r[nameIdx]?.trim() || undefined : undefined,
    attended:
      attendedIdx >= 0 ? truthy(r[attendedIdx]) : true /* default to attended for post-event uploads */,
    verified: verifiedIdx >= 0 ? truthy(r[verifiedIdx]) : false,
  })).filter((r) => r.email);
}
