
import { norm360, angleDiffSigned } from "./math";

export const initSwiss = async () => {
  const mod = await import("https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js");
  const SwissEph = mod.default;
  const swe = new SwissEph();
  await swe.initSwissEph();
  return swe;
};

export const setTopo = (swe, lon, lat, alt = 0) => {
  if (swe?.set_topo) swe.set_topo(lon, lat, alt);
};

export const sunTropical = (swe, jd) => norm360(swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH)[0]);
export const moonTropical = (swe, jd) => norm360(swe.calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH)[0]);

const sidFlags = (swe) => (swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL);
export const sunSidereal = (swe, jd) => {
  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  return norm360(swe.calc_ut(jd, swe.SE_SUN, sidFlags(swe))[0]);
};
export const moonSidereal = (swe, jd) => {
  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  return norm360(swe.calc_ut(jd, swe.SE_MOON, sidFlags(swe))[0]);
};

// Root-finding utilities (bisection after coarse stepping)
export const findCrossing = (fAtJd, targetDeg, { jdStart, dir = 1, step = 0.5, maxDays = 45, tol = 1e-4 }) => {
  const f = (jd) => angleDiffSigned(fAtJd(jd), targetDeg === 360 ? 0 : targetDeg);
  let jd0 = jdStart, f0 = f(jd0);
  if (Math.abs(f0) < 1e-6) return jd0;
  let jd1 = jd0 + dir * step, f1 = f(jd1), traveled = step;
  while (f0 * f1 > 0 && traveled < maxDays) {
    jd0 = jd1; f0 = f1; jd1 += dir * step; f1 = f(jd1); traveled += step;
  }
  if (f0 * f1 > 0) return null;
  let a = Math.min(jd0, jd1), b = Math.max(jd0, jd1), fa = f(a), fb = f(b), iter = 0;
  while (b - a > tol && iter < 80) {
    const mid = 0.5 * (a + b), fm = f(mid);
    if (fa * fm <= 0) { b = mid; fb = fm; } else { a = mid; fa = fm; }
    iter++;
  }
  return 0.5 * (a + b);
};

export const buildFuncs = (swe) => {
  const sepTropical = (jd) => {
    const s = sunTropical(swe, jd);
    const m = moonTropical(swe, jd);
    return norm360(m - s);
  };
  return {
    sepTropical,
    moonSid: (jd) => moonSidereal(swe, jd),
    sunSid:  (jd) => sunSidereal(swe, jd),
  };
};
