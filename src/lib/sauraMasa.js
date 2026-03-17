
import { RASHI_NAMES } from "./constants";
import { findCrossing, buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

export const computeSauraMasa = (swe, jd) => {
  const { sunSid } = buildFuncs(swe);
  const lon = sunSid(jd);
  const idx = Math.floor(lon / 30);
  const name = `${RASHI_NAMES[idx]} Māsa`;
  const prog = ((lon % 30) / 30) * 100;

  const startDeg = (idx * 30) % 360;
  const endDeg   = ((idx + 1) * 30) % 360;
  const startJd  = findCrossing(sunSid, startDeg, { jdStart: jd, dir: -1, step: 1, maxDays: 370 });
  const endJd    = findCrossing(sunSid, endDeg,   { jdStart: jd, dir: +1, step: 1, maxDays: 370 });

  return {
    name,
    meta: `Saura Māsa #${idx + 1}/12 • ${prog.toFixed(1)}%`,
    times: `${startJd ? jdToLocalStringCompact(startJd) : "-"} ↔ ${endJd ? jdToLocalStringCompact(endJd) : "-"}`,
    progress: Number(prog.toFixed(1)),
  };
};