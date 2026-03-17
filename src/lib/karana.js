
import { KARANA_REPEAT } from "./constants";
import { findCrossing, buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

export const computeKarana = (swe, jd) => {
  const { sepTropical } = buildFuncs(swe);
  const sep = sepTropical(jd);
  const kFloat = sep / 6;
  const idx = Math.floor(kFloat);
  const prog = (kFloat - idx) * 100;

  let name = "-";
  if (idx === 0) name = "Kimstughna";
  else if (idx >= 1 && idx <= 56) name = KARANA_REPEAT[(idx - 1) % 7];
  else if (idx === 57) name = "Śakuni";
  else if (idx === 58) name = "Catuṣpāda";
  else if (idx === 59) name = "Nāga";

  const startDeg = (idx * 6) % 360;
  const endDeg   = ((idx + 1) * 6) % 360;
  const startJd  = findCrossing(sepTropical, startDeg, { jdStart: jd, dir: -1 });
  const endJd    = findCrossing(sepTropical, endDeg,   { jdStart: jd, dir: +1 });

  return {
    name,
    meta: `Karana #${idx + 1}/60 • ${prog.toFixed(1)}%`,
    times: `${startJd ? jdToLocalStringCompact(startJd) : "-"} ↔ ${endJd ? jdToLocalStringCompact(endJd) : "-"}`,
    progress: Number(prog.toFixed(1)),
  };
};
