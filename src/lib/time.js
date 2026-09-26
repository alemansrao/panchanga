// ./lib/time.js

const JD_UNIX_EPOCH = 2440587.5;

const pad = (n) => String(n).padStart(2, "0");

/*
 * Get calendar components for an absolute Date in a specific IANA timezone.
 */
const getZonedParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  return values;
};

/*
 * Convert Julian Day to a human-readable local date/time.
 *
 * timeZone is optional for backward compatibility.
 */
export const jdToLocalString = (jd, timeZone) => {
  const ms = (jd - JD_UNIX_EPOCH) * 86400000;
  const d = new Date(ms);

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(d);
};

/*
 * Convert Julian Day to compact local date/time.
 */
export const jdToLocalStringCompact = (jd, timeZone) => {
  const ms = (jd - JD_UNIX_EPOCH) * 86400000;
  const d = new Date(ms);

  /*
   * Preserve the old browser-local behaviour when no timezone
   * is supplied.
   */
  if (!timeZone) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mmm = new Intl.DateTimeFormat(undefined, {
      month: "short",
    }).format(d);

    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");

    return `${dd} ${mmm}, ${yyyy}, ${hh}:${mm}`;
  }

  const p = getZonedParts(d, timeZone);

  const mmm = new Intl.DateTimeFormat(undefined, {
    month: "short",
    timeZone,
  }).format(d);

  return `${pad(p.day)} ${mmm}, ${p.year}, ${pad(p.hour)}:${pad(p.minute)}`;
};

/*
 * Format an absolute Date for <input type="datetime-local">
 * in a specific IANA timezone.
 *
 * Example:
 * toInputLocal(new Date(), "Asia/Kolkata")
 */
export const toInputLocal = (d, timeZone) => {
  /*
   * Backward-compatible browser-local mode.
   */
  if (!timeZone) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const p = getZonedParts(d, timeZone);

  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(
    p.hour
  )}:${pad(p.minute)}`;
};

/*
 * Convert a datetime-local wall-clock value into an absolute Date
 * using the specified IANA timezone.
 *
 * Example:
 * localDateTimeToDate(
 *   "2026-09-26T12:10",
 *   "Asia/Kolkata"
 * )
 *
 * => 2026-09-26T06:40:00.000Z
 */
export const localDateTimeToDate = (value, timeZone) => {
  if (!value || !timeZone) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
      value
    );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);

  /*
   * Treat the entered wall-clock components temporarily as UTC.
   * We then calculate the timezone offset and correct the timestamp.
   */
  const wallClockMs = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    0
  );

  let utcMs = wallClockMs;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  /*
   * A few iterations handle timezone offsets and DST transitions.
   */
  for (let i = 0; i < 3; i++) {
    const parts = {};

    for (const part of formatter.formatToParts(new Date(utcMs))) {
      if (part.type !== "literal") {
        parts[part.type] = Number(part.value);
      }
    }

    const localClockMs = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0
    );

    const offsetMs = localClockMs - utcMs;
    const nextUtcMs = wallClockMs - offsetMs;

    if (nextUtcMs === utcMs) {
      break;
    }

    utcMs = nextUtcMs;
  }

  return new Date(utcMs);
};

/*
 * Add calendar days to a datetime-local string without allowing
 * the browser timezone to affect the result.
 */
export const addDaysToLocalDateTime = (value, days) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(
    value ?? ""
  );

  if (!match) {
    return value;
  }

  const calendar = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      0,
      0,
      0,
      0
    )
  );

  calendar.setUTCDate(
    calendar.getUTCDate() + Number(days)
  );

  return `${calendar.getUTCFullYear()}-${pad(
    calendar.getUTCMonth() + 1
  )}-${pad(calendar.getUTCDate())}T${match[4]}:${match[5]}`;
};