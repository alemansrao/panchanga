
// /lib/tithiFinder.js
// Find Tithi occurrences filtered by Solar (Saura) Māsa, Paksha, and Tithi number within a Gregorian year.

import { buildFuncs } from "./swisseph";
import { TITHI_NAMES } from "./constants";
// --- Public constants for UI ---
// Saura Māsa names by Sun's sidereal sign: 0..11 => Mesha..Meena
export const MASA_OPTIONS = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karkataka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrischika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
];

export const PAKSHA_OPTIONS = ["Shukla", "Krishna"];
export const TITHI_NUMBERS = Array.from({ length: 15 }, (_, i) => i + 1);

// --- Helpers ---
const degNorm = (x) => {
  let y = x % 360;
  if (y < 0) y += 360;
  return y;
};

function dateToJd(swe, date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const hourUT =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3_600_000;
  return swe.julday(y, m, d, hourUT);
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60_000);
}

function getSiderealFuncs(swe) {
  const { moonSid, sunSid } = buildFuncs(swe);
  return { moonSid, sunSid };
}

function elongationDeg(swe, jd, moonSid, sunSid) {
  return degNorm(moonSid(jd) - sunSid(jd));
}

// Tithi index 1..30 => also paksha + number (1..15)
function tithiFromElongation(sepDeg) {
  const idx = Math.floor(sepDeg / 12) + 1; // 1..30
  const paksha = idx <= 15 ? "Shukla" : "Krishna";
  const tithiNum = idx <= 15 ? idx : idx - 15;
  return { idx, paksha, tithiNum };
}

function tithiAt(swe, date, moonSid, sunSid) {
  const jd = dateToJd(swe, date);
  const sep = elongationDeg(swe, jd, moonSid, sunSid);
  return tithiFromElongation(sep);
}

// --- Saura Māsa (Solar month) at a given Date ---
// Determined by Sun's sidereal sign at that moment.
function solarMasaAt(swe, date) {
  const { sunSid } = getSiderealFuncs(swe);
  const jd = dateToJd(swe, date);
  const signIdx = Math.floor(sunSid(jd) / 30); // 0..11
  return MASA_OPTIONS[signIdx];
}

// --- Refine exact start/end for a target tithi index around an approximate time ---
function refineTithiStartEnd(swe, approxDate, targetIdx) {
  const { moonSid, sunSid } = getSiderealFuncs(swe);
  const current = tithiAt(swe, approxDate, moonSid, sunSid).idx;

  let insideDate = approxDate;
  if (current !== targetIdx) {
    // Scan +/- 24h in 1h steps to enter target tithi
    let found = null;
    for (const dir of [-1, 1]) {
      let probe = new Date(approxDate);
      for (let i = 0; i < 48; i++) {
        probe = addMinutes(probe, dir * 60);
        if (tithiAt(swe, probe, moonSid, sunSid).idx === targetIdx) {
          found = probe;
          break;
        }
      }
      if (found) break;
    }
    if (!found) return null;
    insideDate = found;
  }

  // Backward boundary
  let lo = new Date(insideDate);
  let stepMin = 60;
  for (let i = 0; i < 48; i++) {
    const test = addMinutes(lo, -stepMin);
    if (tithiAt(swe, test, moonSid, sunSid).idx !== targetIdx) {
      // binary search [test, lo]
      let a = test,
        b = lo;
      for (let k = 0; k < 40; k++) {
        const mid = new Date((a.getTime() + b.getTime()) / 2);
        if (tithiAt(swe, mid, moonSid, sunSid).idx === targetIdx) b = mid;
        else a = mid;
      }
      lo = b;
      break;
    }
    lo = test;
  }

  // Forward boundary
  let hi = new Date(insideDate);
  stepMin = 60;
  for (let i = 0; i < 48; i++) {
    const test = addMinutes(hi, stepMin);
    if (tithiAt(swe, test, moonSid, sunSid).idx !== targetIdx) {
      // binary search [hi, test]
      let a = hi,
        b = test;
      for (let k = 0; k < 40; k++) {
        const mid = new Date((a.getTime() + b.getTime()) / 2);
        if (tithiAt(swe, mid, moonSid, sunSid).idx === targetIdx) a = mid;
        else b = mid;
      }
      hi = a;
      break;
    }
    hi = test;
  }

  return { start: lo, end: hi };
}

// --- Main search ---
// Inputs:
// - swe: Swiss Ephemeris instance
// - { year, masa: string|null (Saura Māsa), paksha: "Shukla"|"Krishna", tithiNum: 1..15 }
// Output: Array of { masa, paksha, tithi, start, end, label }
export async function findTithiByMasaPaksha(swe, { year, masa, paksha, tithiNum }) {
  const { moonSid, sunSid } = getSiderealFuncs(swe);
  const targetIdx = paksha === "Shukla" ? tithiNum : 15 + tithiNum; // map 1..15 -> 1..30/16..30

  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));

  // Coarse scan every 6 hours; detect entry into target tithi
  const stepHours = 6;
  const hits = [];
  let t = new Date(start);
  let lastInside = false;

  while (t < end) {
    const info = tithiAt(swe, t, moonSid, sunSid);
    const inside = info.idx === targetIdx;
    if (inside && !lastInside) hits.push(new Date(t));
    lastInside = inside;
    t = addMinutes(t, stepHours * 60);
  }

  // Refine & filter by Saura Māsa (determined at tithi start)
  const results = [];
  for (const approx of hits) {
    const refined = refineTithiStartEnd(swe, approx, targetIdx);
    if (!refined) continue;
    const masaName = solarMasaAt(swe, refined.start);
    if (masa && masaName !== masa) continue;
    results.push({
      masa: masaName,
      paksha,
      tithi: TITHI_NAMES[targetIdx - 1],
      start: refined.start,
      end: refined.end,
      label: `${TITHI_NAMES[targetIdx - 1]}`,
    });
  }

  results.sort((a, b) => a.start - b.start);
  const dedup = [];
  const seen = new Set();
  for (const r of results) {
    const key = `${r.masa}|${r.paksha}|${r.tithi}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(r);
    }
  }

  return dedup;
}
