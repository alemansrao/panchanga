
import { TITHI_NAMES } from "./constants";
import { findCrossing, buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";

export const computeTithi = (swe, jd) => {
  const { sepTropical } = buildFuncs(swe);
  const sep = sepTropical(jd);
  const tithiFloat = sep / 12;
  const tithiNum = Math.floor(tithiFloat) + 1;
  const name = TITHI_NAMES[tithiNum - 1];
  const prog = (tithiFloat % 1) * 100;
  const startDeg = ((tithiNum - 1) * 12) % 360;
  const endDeg   = (tithiNum * 12) % 360;
  const startJd  = findCrossing(sepTropical, startDeg, { jdStart: jd, dir: -1 });
  const endJd    = findCrossing(sepTropical, endDeg,   { jdStart: jd, dir: +1 });
  const paksha = tithiNum <= 15 ? "Shukla Paksha" : "Krishna Paksha";

  return {
    name,
    meta: `${paksha} • Tithi #${tithiNum}/30 • ${prog.toFixed(1)}%`,
    times: `${startJd ? jdToLocalStringCompact(startJd) : "-"} ↔ ${endJd ? jdToLocalStringCompact(endJd) : "-"}`,
    progress: Number(prog.toFixed(1)),
  };
};
