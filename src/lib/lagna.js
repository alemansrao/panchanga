import { RASHI_NAMES } from "./constants";
import { findCrossing } from "./swisseph";
import { jdToLocalStringCompact } from "./time";
import { norm360 } from "./math";

export const computeLagna = (swe, jd, { lat, lon }) => {
  if (!swe) return null;

  const ascAtJd = (j) => {
    try {
      const res = swe.houses(j, Number(lat), Number(lon), "P");
      const asc = (res && res.ascmc && res.ascmc[0]) || (res && res.ascmc && res.ascmc[0]);
      return norm360(Number(asc) || 0);
    } catch (e) {
      return 0;
    }
  };

  const ascDeg = ascAtJd(jd);
  const idx = Math.floor(ascDeg / 30) % 12;
  const name = RASHI_NAMES[idx];
  const prog = ((ascDeg % 30) / 30) * 100;

  const startDeg = (idx * 30) % 360;
  const endDeg = ((idx + 1) * 30) % 360;
  const startJd = findCrossing(ascAtJd, startDeg, { jdStart: jd, dir: -1 });
  const endJd = findCrossing(ascAtJd, endDeg, { jdStart: jd, dir: +1 });

  return {
    name: `${name} (${ascDeg.toFixed(2)}°)`,
    meta: `Lagna #${idx + 1}/12 • ${prog.toFixed(1)}%`,
    times: `${startJd ? jdToLocalStringCompact(startJd) : "-"} ↔ ${endJd ? jdToLocalStringCompact(endJd) : "-"}`,
    progress: Number(prog.toFixed(1)),
    ascDeg,
  };
};

export default computeLagna;
