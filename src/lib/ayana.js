
import { findCrossing, buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

export const computeAyana = (swe, jd) => {
  const { sunSid } = buildFuncs(swe);
  const lon = sunSid(jd);
  const isUttara = (lon >= 270 || lon < 90);
  const name = isUttara ? "Uttarāyaṇa" : "Dakṣiṇāyaṇa";

  const startDeg = isUttara ? 270 : 90;
  const endDeg   = isUttara ? 90 : 270;

  const startJd = findCrossing(sunSid, startDeg, { jdStart: jd, dir: -1, step: 1, maxDays: 370 });
  const endJd   = findCrossing(sunSid, endDeg,   { jdStart: jd, dir: +1, step: 1, maxDays: 370 });

  const delta = isUttara ? ((lon - 270 + 360) % 360) : ((lon - 90 + 360) % 360);
  const prog = (Math.min(Math.max(delta, 0), 180) / 180) * 100;

  return {
    name,
    meta: `Sun moving towards ${isUttara ? "North" : "South"} • ${prog.toFixed(1)}%`,
    times: `${startJd ? jdToLocalStringCompact(startJd) : "-"} ↔ ${endJd ? jdToLocalStringCompact(endJd) : "-"}`,
    progress: Number(prog.toFixed(1)),
  };
};
