export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ─── Parse a "H:MM AM/PM" display string → 24-hour "HH:MM" ──────────────────

export function displayTimeTo24h(display: string): string {
  // e.g. "1:00 PM" → "13:00", "8:30 AM" → "08:30"
  const match = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "00:00";
  let hours = parseInt(match[1]!, 10);
  const minutes = match[2]!;
  const period = match[3]!.toUpperCase();
  if (period === "AM" && hours === 12) hours = 0;
  if (period === "PM" && hours !== 12) hours += 12;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

// ─── Convert 24-hour "HH:MM" → display "H:MM AM/PM" ─────────────────────────

export function h24ToDisplayTime(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr ?? "0", 10);
  const m = mStr ?? "00";
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

// ─── Build a UTC ISO string from a local date + local display time ────────────
//
// Why: The backend expects ISO datetime strings.  We must take the user's
// LOCAL calendar date (e.g. "2025-04-10") and LOCAL time (e.g. "1:00 PM")
// and emit the UTC equivalent so the DB stores the right instant.
//
// Example (EAT = UTC+3):
//   localDate "2025-04-10", localTime "1:00 PM"  →  "2025-04-10T10:00:00.000Z"

export function localDateTimeToUTC(
  localDateYMD: string, // "YYYY-MM-DD" in user's local calendar
  localDisplayTime: string, // "H:MM AM/PM"
  tz: string = getUserTimezone(),
): string {
  const time24 = displayTimeTo24h(localDisplayTime);
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);

  const [yStr, moStr, dStr] = localDateYMD.split("-");
  const y = parseInt(yStr ?? "1970", 10);
  const mo = parseInt(moStr ?? "1", 10) - 1;
  const d = parseInt(dStr ?? "1", 10);

  // Build the local instant using the Intl trick:
  // Construct a Date that *represents* the given wall-clock time in `tz`.
  // We do this by formatting a UTC epoch in `tz` and binary-searching for
  // the UTC ms whose local representation matches — but a simpler approach
  // is to use the offset at that moment.
  const naive = new Date(Date.UTC(y, mo, d, h, m, 0, 0));

  // Get the UTC offset (in minutes) for this tz at this moment
  const offset = getUTCOffsetMinutes(naive, tz);

  // Shift: local = UTC + offset  →  UTC = local - offset
  const utcMs = naive.getTime() - offset * 60_000;
  return new Date(utcMs).toISOString();
}

// ─── Parse a UTC ISO string → local display date "YYYY-MM-DD" ────────────────

export function utcToLocalDateYMD(
  utcISO: string,
  tz: string = getUserTimezone(),
): string {
  const d = new Date(utcISO);
  // Use Intl to format in the target TZ
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

// ─── Parse a UTC ISO string → local display time "H:MM AM/PM" ────────────────

export function utcToLocalDisplayTime(
  utcISO: string,
  tz: string = getUserTimezone(),
): string {
  const d = new Date(utcISO);
  return d.toLocaleTimeString("en-KE", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Get UTC offset in minutes for a given tz at a given instant ─────────────
//
// Positive = east of UTC (e.g. EAT = +180), negative = west.

function getUTCOffsetMinutes(date: Date, tz: string): number {
  // Format the date in both UTC and local, compare.
  const utcStr = formatInTZ(date, "UTC");
  const localStr = formatInTZ(date, tz);

  const utcMs = parseFormattedDate(utcStr);
  const localMs = parseFormattedDate(localStr);

  // local = UTC + offset  →  offset = local - UTC
  return (localMs - utcMs) / 60_000;
}

function formatInTZ(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function parseFormattedDate(s: string): number {
  // "en-CA" produces "YYYY-MM-DD, HH:MM:SS" or "YYYY-MM-DD HH:MM:SS"
  // Normalize and parse as UTC for comparison
  const clean = s.replace(",", "").replace(/\s+/g, " ").trim();
  const [datePart, timePart] = clean.split(" ");
  if (!datePart || !timePart) return 0;
  return new Date(`${datePart}T${timePart}Z`).getTime();
}

// ─── Convenience: build a "scheduledAt" ISO for the upsert payload ────────────

export function buildScheduledAtISO(
  weekMondayLocalYMD: string, // "YYYY-MM-DD" (local)
  dayIndex: number,           // 0=Mon … 6=Sun
  displayTime: string,        // "H:MM AM/PM"
  tz: string = getUserTimezone(),
): string {
  // Compute the local YMD for the target day
  const [yStr, moStr, dStr] = weekMondayLocalYMD.split("-");
  const y = parseInt(yStr ?? "1970", 10);
  const mo = parseInt(moStr ?? "1", 10) - 1;
  const d = parseInt(dStr ?? "1", 10);

  const dayDate = new Date(y, mo, d + dayIndex);
  const dayYMD = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;

  return localDateTimeToUTC(dayYMD, displayTime, tz);
}

// ─── Convenience: get the local "YYYY-MM-DD" for a given day offset ───────────
//
// Used when building `scheduledDate` for the upsert payload.

export function localDayYMD(
  weekMondayLocalYMD: string,
  dayIndex: number,
): string {
  const [yStr, moStr, dStr] = weekMondayLocalYMD.split("-");
  const y = parseInt(yStr ?? "1970", 10);
  const mo = parseInt(moStr ?? "1", 10) - 1;
  const d = parseInt(dStr ?? "1", 10);

  const dayDate = new Date(y, mo, d + dayIndex);
  return `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;
}