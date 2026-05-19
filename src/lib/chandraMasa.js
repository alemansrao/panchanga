import { CHANDRA_MASA_NAMES, RASHI_NAMES } from "./constants";
import { buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

const EPS = 1 / (24 * 60);
const STEP = 0.25; // 6 hours
const MAX_DAYS = 40;
const TOL = 1e-8;

const mod = (n, m) => ((n % m) + m) % m;
const signIndex = (lon) => Math.floor(mod(lon, 360) / 30) % 12;
const masaIndexFromStartSunSign = (sunSignIdx) => mod(sunSignIdx + 1, 12);
const getSignDiffForward = (a, b) => mod(b - a, 12);

/* --------------------------
   ✅ Robust New Moon finder
--------------------------- */
const findNewMoon = (sep, jdStart, dir = 1) => {
  let jd0 = jdStart;

  for (let travelled = 0; travelled <= MAX_DAYS; travelled += STEP) {
    const jd1 = jd0 + dir * STEP;

    const a = Math.min(jd0, jd1);
    const b = Math.max(jd0, jd1);

    const sepA = sep(a);
    const sepB = sep(b);

    if (sepA > 300 && sepB < 60) {
      let lo = a;
      let hi = b;

      const f = (jd) => {
        let v = sep(jd);
        if (v < 180) v += 360;
        return v - 360;
      };

      let flo = f(lo);

      for (let i = 0; i < 80 && hi - lo > TOL; i++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);

        if (flo * fm <= 0) {
          hi = mid;
        } else {
          lo = mid;
          flo = fm;
        }
      }

      return (lo + hi) / 2;
    }

    jd0 = jd1;
  }

  return null;
};

/* --------------------------
   ✅ Robust Full Moon finder
--------------------------- */
const findFullMoon = (sep, jdStart, dir = 1) => {
  let jd0 = jdStart;

  for (let travelled = 0; travelled <= MAX_DAYS; travelled += STEP) {
    const jd1 = jd0 + dir * STEP;

    const a = Math.min(jd0, jd1);
    const b = Math.max(jd0, jd1);

    const sepA = sep(a);
    const sepB = sep(b);

    // Around 180°
    if (sepA < 120 && sepB > 240) {
      let lo = a;
      let hi = b;

      const f = (jd) => sep(jd) - 180;

      let flo = f(lo);

      for (let i = 0; i < 80 && hi - lo > TOL; i++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);

        if (flo * fm <= 0) {
          hi = mid;
        } else {
          lo = mid;
          flo = fm;
        }
      }

      return (lo + hi) / 2;
    }

    jd0 = jd1;
  }

  return null;
};

/* =========================================================
   ✅ MAIN: computeChandraMasa
   mode = "AMANTA" | "PURNIMANTA"
========================================================= */

export const computeChandraMasa = (swe, jd, mode = "AMANTA") => {
  const { sepTropical, sunSid } = buildFuncs(swe);

  /* ---------------------------------------
     ✅ CORE LOGIC: ALWAYS NEW MOON → NEW MOON
     (Do NOT change this — protects Adhika)
  --------------------------------------- */

  const nmStart = findNewMoon(sepTropical, jd - EPS, -1);
  let nmEnd = findNewMoon(sepTropical, jd + EPS, +1);

  if (nmStart && (!nmEnd || nmEnd <= nmStart + 1)) {
    nmEnd = findNewMoon(sepTropical, nmStart + 1, +1);
  }

  if (!nmStart || !nmEnd || nmEnd <= nmStart) {
    return {
      name: "-",
      meta: "Unable to determine lunar month",
      times: "-",
      progress: 0,
    };
  }

  /* ---------------------------------------
     ✅ Adhika/Kshaya detection (correct)
  --------------------------------------- */

  const startSunSign = signIndex(sunSid(nmStart + EPS));
  const endSunSign = signIndex(sunSid(nmEnd - EPS));

  const sankrantiCount = getSignDiffForward(startSunSign, endSunSign);

  const masaIdx = masaIndexFromStartSunSign(startSunSign);
  const masaName = CHANDRA_MASA_NAMES[masaIdx];

  const isAdhika = sankrantiCount === 0;
  const hasKshaya = sankrantiCount > 1;

  /* ---------------------------------------
     ✅ DISPLAY RANGE (this is the ONLY difference)
  --------------------------------------- */

  let startJd = nmStart;
  let endJd = nmEnd;
  let displayMasaName = masaName;

  if (mode === "PURNIMANTA") {
    // Shift to Purnima boundaries
    const pmStart = findFullMoon(sepTropical, nmStart + 1, +1);
    const pmEnd = findFullMoon(sepTropical, nmEnd + 1, +1);

    if (pmStart && pmEnd) {
      startJd = pmStart;
      endJd = pmEnd;
    }

    // Month name shifts back by 1 in Purnimanta
    displayMasaName = CHANDRA_MASA_NAMES[mod(masaIdx - 1, 12)];
  }

  /* ---------------------------------------
     ✅ Formatting
  --------------------------------------- */

  const progress =
    Math.max(0, Math.min(1, (jd - startJd) / (endJd - startJd))) * 100;

  let name = `${displayMasaName} Māsa`;
  if (isAdhika) name = `Adhika ${name}`;

  const flags = [];
  if (isAdhika) flags.push("Adhika");

  if (hasKshaya) {
    flags.push("Kṣaya");
  }

  return {
    name,
    meta: [
      "Chandra Māsa",
      `Saṅkrānti count: ${sankrantiCount}`,
      ...flags,
      `${progress.toFixed(1)}%`,
    ].join(" • "),
    times: `${jdToLocalStringCompact(startJd)} → ${jdToLocalStringCompact(endJd)}`,
    progress: Number(progress.toFixed(1)),

    // Debug
    masaName: displayMasaName,
    baseMasaName: masaName,
    isAdhika,
    hasKshaya,
    startJd,
    endJd,
    sankrantiCount,
    mode,
  };
};

export default computeChandraMasa;