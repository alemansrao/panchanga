
import { RASHI_NAMES } from "./constants";
import { findCrossing, buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

export const computeJanmaRashi = (swe, jd) => {
  const { moonSid } = buildFuncs(swe);
  const lon = moonSid(jd);
  const idx = Math.floor(lon / 30);       // 0..11
  const name = RASHI_NAMES[idx];
  const prog = ((lon % 30) / 30) * 100;

  const startDeg = (idx * 30) % 360;
  const endDeg   = ((idx + 1) * 30) % 360;
  const startJd  = findCrossing(moonSid, startDeg, { jdStart: jd, dir: -1 });
  const endJd    = findCrossing(moonSid, endDeg,   { jdStart: jd, dir: +1 });

  return {
    name,
    meta: `Janma Rāśi #${idx + 1}/12 • ${prog.toFixed(1)}%`,
    times: `${startJd ? jdToLocalStringCompact(startJd) : "-"} ↔ ${endJd ? jdToLocalStringCompact(endJd) : "-"}`,
    progress: Number(prog.toFixed(1)),
  };
};
