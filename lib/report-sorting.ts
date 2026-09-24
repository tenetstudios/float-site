export type SortValue = string | number | null;
export type SortDirection = "ascending" | "descending";

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

// Missing observations stay last in either direction. Sort raw values, never display strings.
export function compareReportValues(a: SortValue, b: SortValue, direction: SortDirection): number {
  const missingA = a === null || (typeof a === "number" && !Number.isFinite(a));
  const missingB = b === null || (typeof b === "number" && !Number.isFinite(b));
  if (missingA || missingB) return missingA === missingB ? 0 : missingA ? 1 : -1;
  const order = typeof a === "number" && typeof b === "number" ? a - b : collator.compare(String(a), String(b));
  return direction === "ascending" ? order : -order;
}
