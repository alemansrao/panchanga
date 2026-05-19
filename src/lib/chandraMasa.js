import { CHANDRA_MASA_NAMES, RASHI_NAMES } from "./constants";
import { buildFuncs, findCrossing } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

const EPS = 1 / (24 * 60); // 1 minute in days

const mod = (n, m) => ((n % m) + m) % m;

const signIndex = (lon) => Math.floor(mod(lon, 360) / 30) % 12;

// Amanta mapping:
// Sun in Meena at lunar month start => Chaitra
// Sun in Mesha => Vaishakha, etc.
const masaIndexFromStartSunSign = (sunSignIdx) => mod(sunSignIdx + 1, 12);

const getSignDiffForward = (fromSign, toSign) => mod(toSign - fromSign, 12);

export const computeChandraMasa = (swe, jd) => {
  const { sepTropical, sunSid } = buildFuncs(swe);

  // Previous and next New Moon around current JD
  const startJd = findCrossing(sepTropical, 0, {
    jdStart: jd,
    dir: -1,
    step: 0.5,
    maxDays: 35,
    tol: 1e-6,
  });

  const endJd = findCrossing(sepTropical, 0, {
    jdStart: jd + 0.5,
    dir: +1,
    step: 0.5,
    maxDays: 35,
    tol: 1e-6,
  });

  if (!startJd || !endJd) {
    return {
      name: "-",
      meta: "Unable to determine lunar month boundaries",
      times: "-",
      progress: 0,
    };
  }

  const startSunSign = signIndex(sunSid(startJd + EPS));
  const endSunSign = signIndex(sunSid(endJd - EPS));

  const sankrantiCount = getSignDiffForward(startSunSign, endSunSign);

  const masaIdx = masaIndexFromStartSunSign(startSunSign);
  const masaName = CHANDRA_MASA_NAMES[masaIdx];

  const isAdhika = sankrantiCount === 0;
  const hasKshaya = sankrantiCount > 1;

  const skippedSigns = [];
  const skippedMasas = [];

  if (hasKshaya) {
    for (let i = 1; i < sankrantiCount; i++) {
      const skippedSign = mod(startSunSign + i, 12);
      skippedSigns.push(RASHI_NAMES[skippedSign]);
      skippedMasas.push(CHANDRA_MASA_NAMES[masaIndexFromStartSunSign(skippedSign)]);
    }
  }

  const progress = Math.max(0, Math.min(1, (jd - startJd) / (endJd - startJd))) * 100;

  let displayName = `${masaName} Māsa`;
  if (isAdhika) displayName = `Adhika ${displayName}`;

  const flags = [];
  if (isAdhika) flags.push("Adhika");
  if (hasKshaya) flags.push(`Kṣaya: ${skippedMasas.join(", ")}`);

  return {
    name: displayName,
    meta: [
      `Chandra Māsa`,
    //   `Sun at start: ${RASHI_NAMES[startSunSign]}`,
      `Saṅkrānti count: ${sankrantiCount}`,
      ...flags,
      `${progress.toFixed(1)}%`,
    ].join(" • "),
    times: `${jdToLocalStringCompact(startJd)} → ${jdToLocalStringCompact(endJd)}`,
    progress: Number(progress.toFixed(1)),

    // useful raw fields
    masaName,
    masaIndex: masaIdx,
    isAdhika,
    hasKshaya,
    skippedMasas,
    skippedSigns,
    startJd,
    endJd,
    sankrantiCount,
  };
};

export default computeChandraMasa;