
import { RUTHU_NAMES } from "./constants";
import { findCrossing, buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

export const computeRuthu = (swe, jd) => {
  const { sunSid } = buildFuncs(swe);
  const SEG = 60;
  const OFFSET = 30;

  const lon = sunSid(jd);
  const lonShift = (lon + OFFSET) % 360;

  const rFloat = lonShift / SEG;
  const idx = Math.floor(rFloat);
  const name = `${RUTHU_NAMES[idx]} Ruthu`;
  const prog = (rFloat - idx) * 100;

  const startDeg = (idx * SEG - OFFSET + 360) % 360;
  const endDeg   = (startDeg + SEG) % 360;

  const startJd  = findCrossing(sunSid, startDeg, { jdStart: jd, dir: -1, step: 1, maxDays: 370 });
  const endJd    = findCrossing(sunSid, endDeg,   { jdStart: jd, dir: +1, step: 1, maxDays: 370 });

  return {
    name,
    meta: `Ruthu #${idx + 1}/6 • ${prog.toFixed(1)}%`,
    times: `${startJd ? jdToLocalStringCompact(startJd) : "-"} ↔ ${endJd ? jdToLocalStringCompact(endJd) : "-"}`,
    progress: Number(prog.toFixed(1)),
  };
};
