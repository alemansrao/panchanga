
import { NAKSHATRA_NAMES } from "./constants";
import { findCrossing, buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

export const computeNakshatra = (swe, jd) => {
  const { moonSid } = buildFuncs(swe);
  const seg = 360 / 27;
  const lon = moonSid(jd);
  const nFloat = lon / seg;
  const idx = Math.floor(nFloat);
  const name = NAKSHATRA_NAMES[idx];
  const prog = (nFloat - idx) * 100;

  const startDeg = (idx * seg) % 360;
  const endDeg   = ((idx + 1) * seg) % 360;
  const startJd  = findCrossing(moonSid, startDeg, { jdStart: jd, dir: -1, step: 0.5, maxDays: 45 });
  const endJd    = findCrossing(moonSid, endDeg,   { jdStart: jd, dir: +1, step: 0.5, maxDays: 45 });

  return {
    name,
    meta: `Nakshatra #${idx + 1}/27 • ${prog.toFixed(1)}%`,
    times: `${startJd ? jdToLocalStringCompact(startJd) : "-"} ↔ ${endJd ? jdToLocalStringCompact(endJd) : "-"}`,
    progress: Number(prog.toFixed(1)),
  };
};
