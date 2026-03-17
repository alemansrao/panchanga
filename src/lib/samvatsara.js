
// ./lib/samvatsara.js
// Samvatsara (60-year Jovian cycle) keyed to Mesha Saṅkrānti (sidereal Sun = 0°).
// Anchor: Mesha Saṅkrānti of 2024 starts "Krodhi".

import { findCrossing, buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

const JD_UNIX_EPOCH = 2440587.5;
const jdToDate = (jd) => new Date((jd - JD_UNIX_EPOCH) * 86400000);

// Full 60-name list starting at "Prabhava"
const SAMVATSARA_NAMES = [
  "Prabhava", "Vibhava", "Shukla", "Pramoda", "Prajapati", "Angirasa", "Srimukha", "Bhava", "Yuva", "Dhata",
  "Ishvara", "Bahudhanya", "Pramadi", "Vikrama", "Vrisha", "Chitrabhanu", "Svabhanu", "Tarana", "Parthiva", "Vyaya",
  "Sarvajit", "Sarvadhari", "Virodhi", "Vikruti", "Khara", "Nandana", "Vijaya", "Jaya", "Manmatha", "Durmukha",
  "Hevilambi", "Vilambi", "Vikari", "Sharvari", "Plava", "Shubhakrit", "Shobhakrit", "Krodhi", "Vishvavasu", "Parabhava",
  "Plavanga", "Kilaka", "Saumya", "Sadharana", "Virodhikrit", "Paridhavi", "Pramadicha", "Ananda", "Rakshasa", "Nala",
  "Pingala", "Kalayukta", "Siddharthi", "Raudri", "Durmati", "Dundubhi", "Rudhirodgari", "Raktakshi", "Krodhana", "Kshaya"
];

// ---- Helpers ----

const findMeshaOfGregorianYear = (swe, yearUTC) => {
  const { sunSid } = buildFuncs(swe);
  const startJD =
    Date.UTC(yearUTC, 2, 10, 0, 0, 0) / 86400000 + JD_UNIX_EPOCH;   // Mar is month=2
  const endJD =
    Date.UTC(yearUTC, 3, 30, 23, 59, 0) / 86400000 + JD_UNIX_EPOCH; // Apr is month=3

  // Start near Apr 13 12:00 UTC to reduce steps
  const guessJD =
    Date.UTC(yearUTC, 3, 13, 12, 0, 0) / 86400000 + JD_UNIX_EPOCH;

  // Use a small step and cap maxDays to this window
  const root = findCrossing(sunSid, 0, {
    jdStart: guessJD,
    dir: +1,
    step: 0.25,
    maxDays: 60,
    tol: 1e-6
  });

  // Validate it's inside our window (defensive)
  if (root && root >= startJD && root <= endJD) return root;
  // Try scanning backward if needed
  const rootBack = findCrossing(sunSid, 0, {
    jdStart: guessJD,
    dir: -1,
    step: 0.25,
    maxDays: 60,
    tol: 1e-6
  });
  if (rootBack && rootBack >= startJD && rootBack <= endJD) return rootBack;

  return null;
};

// Previous Mesha before jdNow and the next Mesha after jdNow
const getMeshaBracketSafe = (swe, jdNow) => {
  const nowDate = jdToDate(jdNow);
  const y = nowDate.getUTCFullYear();

  const meshaThisYear = findMeshaOfGregorianYear(swe, y);
  let prev, next;

  if (meshaThisYear && meshaThisYear <= jdNow) {
    prev = meshaThisYear;
    next = findMeshaOfGregorianYear(swe, y + 1);
  } else {
    prev = findMeshaOfGregorianYear(swe, y - 1);
    next = meshaThisYear || findMeshaOfGregorianYear(swe, y);
  }
  return { prev, next };
};

// Precise anchor: Mesha 2024
const computeAnchorMesha2024 = (swe) => findMeshaOfGregorianYear(swe, 2024);

// Map Samvatsara by *Gregorian year* of prev Mesha relative to 2024 ("Krodhi")
const samvatsaraNameFromPrevMesha = (prevJD) => {
  const anchorName = "Krodhi";
  const anchorIndex = SAMVATSARA_NAMES.indexOf(anchorName);
  if (anchorIndex < 0) return null;

  const prevYear = jdToDate(prevJD).getUTCFullYear();
  const nYears = prevYear - 2024;

  const idx = ((anchorIndex + nYears) % 60 + 60) % 60;
  return SAMVATSARA_NAMES[idx];
};

export const computeSamvatsara = (swe, jdNow) => {
  const anchor = computeAnchorMesha2024(swe);
  if (!anchor) return null;

  const { prev, next } = getMeshaBracketSafe(swe, jdNow);
  if (!prev || !next) return null;

  const name = samvatsaraNameFromPrevMesha(prev);

  // Progress across current Samvatsara (prev Mesha → next Mesha)
  const progress = Math.max(0, Math.min(1, (jdNow - prev) / (next - prev))) * 100;

  return {
    name,
    meta: "Year runs from Mesha Saṅkrānti to next Mesha Saṅkrānti",
    times: `${jdToLocalStringCompact(prev)} ↔ ${jdToLocalStringCompact(next)}`,
    progress
  };
};
