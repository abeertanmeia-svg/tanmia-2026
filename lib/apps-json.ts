/** Mapping between the registry statuses and the standalone HTML page's apps.json format (ok/warn/gray/bad). */
export type LegacyStatus = "ok" | "warn" | "gray" | "bad";
export type LegacyApp = { id?: string; name: string; fn: string; status: LegacyStatus; url: string };

export function toLegacyStatus(s: string): LegacyStatus {
  if (s === "tested") return "ok";
  if (s === "testing") return "warn";
  if (s === "broken") return "bad";
  return "gray";
}

/** «ok» is never trusted on import: rule 1 requires the six checks inside the registry. */
export function fromLegacyStatus(s: string): "not_opened" | "testing" | "broken" {
  if (s === "warn" || s === "ok") return "testing";
  if (s === "bad") return "broken";
  return "not_opened";
}
